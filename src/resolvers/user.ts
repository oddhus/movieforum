import {
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  ObjectType,
  Query,
  FieldResolver,
  Root,
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { generateStandardError } from "../utils/generateError";
import {
  LoginInput,
  NewPasswordInput,
  RegisterInput,
} from "./types/user-input";
import { FieldError } from "./types/errors";

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // this is the current user and its ok to show them their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // current user wants to see someone elses email
    return "";
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("options") { token, password }: NewPasswordInput,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (password.length < 8) {
      return generateStandardError(
        undefined,
        "password",
        "Password must atleast contain 8 characters"
      );
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);

    if (!userId) {
      return generateStandardError(undefined, "Token", "Token expired");
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    if (!user) {
      return generateStandardError(
        undefined,
        "Token",
        "The token does not exist"
      );
    }

    await User.update(
      { id: userIdNum },
      {
        password: await argon2.hash(password),
      }
    );

    await redis.del(key);

    // log in user after change password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // the email is not in the db
      return true;
    }

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );

    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") { email, password, firstname, lastname }: RegisterInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const checkDbForUser = await User.findOne({ where: { email } });

    if (checkDbForUser) {
      return generateStandardError(
        undefined,
        "email",
        "An account with that email address already exist"
      );
    }

    if (password.length < 8) {
      return generateStandardError(
        undefined,
        "password",
        "Password must atleast contain 8 characters"
      );
    }

    const hashedPassword = await argon2.hash(password);

    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          email: email.toLowerCase(),
          password: hashedPassword,
          firstname: firstname,
          lastname: lastname,
        })
        .returning("*")
        .execute();
      const user = result.raw[0];
      req.session.userId = user.id;
      return { user };
    } catch (err) {
      return generateStandardError(err);
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") { email, password }: LoginInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { email } });

    let valid;

    if (user) {
      valid = await argon2.verify(user.password, password);
    }

    if (!valid || !user) {
      return generateStandardError(
        undefined,
        "Authentication",
        "Please ensure email and password is correct"
      );
    }

    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async delete(@Ctx() { req }: MyContext): Promise<Boolean> {
    try {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(User)
        .where("id = :id", { id: req.session.userId })
        .execute();
      return true;
    } catch (error) {
      return false;
    }
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
