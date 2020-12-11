import { Comment } from "../entities/Comment";
import { Post } from "../entities/Post";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { CreateAndUpdateCommentInput } from "./types/comment-input";
import { User } from "../entities/User";
import { generateStandardError } from "../utils/generateError";
import { CommentResponse } from "./types/comment-response";
@Resolver(Comment)
export class CommentResolver {
  @Query(() => [Comment])
  async comments(@Arg("id", () => Int) id: number): Promise<Comment[]> {
    return await getConnection()
      .createQueryBuilder()
      .relation(Post, "comments")
      .of(id)
      .loadMany();
  }

  @Mutation(() => Comment)
  @UseMiddleware(isAuth)
  async createComment(
    @Arg("id", () => Int) id: number,
    @Arg("input") input: CreateAndUpdateCommentInput,
    @Ctx() { req }: MyContext
  ): Promise<CommentResponse> {
    try {
      const user = await User.findOne(req.session.userId);

      if (!user) {
        return generateStandardError();
      }

      const post = await Post.findOne(id);

      if (!post) {
        return generateStandardError(
          undefined,
          "id",
          "The post does not exist"
        );
      }

      const comment = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Comment)
        .values({
          ...input,
          creatorName: `${user.firstname} ${user.lastname}`,
        })
        .returning("*")
        .execute();

      await getConnection()
        .createQueryBuilder()
        .relation(Post, "comments")
        .of(post)
        .add(comment.raw[0]);

      return comment.raw[0];
    } catch (error) {
      return generateStandardError(error);
    }
  }
}
