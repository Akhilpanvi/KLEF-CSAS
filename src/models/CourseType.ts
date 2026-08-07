import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CourseTypeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CourseTypeDoc = InferSchemaType<typeof CourseTypeSchema>;

export const CourseType: Model<CourseTypeDoc> =
  models.CourseType || model<CourseTypeDoc>("CourseType", CourseTypeSchema);
