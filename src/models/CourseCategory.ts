import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CourseCategorySchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CourseCategorySchema.index({ name: "text", code: "text" });

export type CourseCategoryDoc = InferSchemaType<typeof CourseCategorySchema>;

export const CourseCategory: Model<CourseCategoryDoc> =
  models.CourseCategory || model<CourseCategoryDoc>("CourseCategory", CourseCategorySchema);
