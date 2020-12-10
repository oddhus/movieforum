import { Post } from "src/entities/Post";
import { Arg, Int, Query, Resolver } from "type-graphql";
import { getConnection } from "typeorm";
import { PaginatedComments } from "./types/comment-response";

@Resolver(Comment)
export class CommentResolver {
  @Query(() => PaginatedComments)
  async posts(@Arg("id", () => Int) id: number): Promise<Comment[]> {
    return await getConnection()
      .createQueryBuilder()
      .relation(Post, "comments")
      .of(id)
      .loadMany();
  }
}
