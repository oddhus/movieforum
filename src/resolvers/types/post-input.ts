import { Post } from "../../entities/Post";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateAndUpdatePostInput implements Partial<Post> {
  @Field()
  title: string;

  @Field()
  text: string;
}
