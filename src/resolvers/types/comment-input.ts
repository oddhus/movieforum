import { Field, InputType } from "type-graphql";

@InputType()
export class CreateAndUpdateCommentInput {
  @Field()
  text: string;
}
