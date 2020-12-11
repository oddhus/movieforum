import { Field, ObjectType } from "type-graphql";
import { FieldError } from "./errors";

@ObjectType()
export class PaginatedComments {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Comment, { nullable: true })
  comments?: Comment[];
}

@ObjectType()
export class CommentsResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Comment, { nullable: true })
  comments?: Comment[];
}

@ObjectType()
export class CommentResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Comment, { nullable: true })
  comment?: Comment;
}
