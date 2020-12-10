import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PaginatedComments {
  @Field(() => [Comment])
  posts: Comment[];

  @Field()
  hasMore: boolean;
}
