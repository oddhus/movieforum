import { InputType, Field } from "type-graphql";
import { User } from "../../entities/User";

@InputType()
export class RegisterInput implements Partial<User> {
  @Field()
  firstname: string;

  @Field()
  lastname: string;

  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class LoginInput implements Partial<User> {
  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class NewPasswordInput implements Partial<User> {
  @Field()
  token: string;

  @Field()
  password: string;
}
