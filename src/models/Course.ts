import { Schema, model, models, type InferSchemaType, type Model, Types } from "mongoose";

export const COURSE_STATUS = ["Active", "Inactive", "Archived"] as const;
export type CourseStatus = (typeof COURSE_STATUS)[number];

const CourseSchema = new Schema(
  {
    regulation: { type: Schema.Types.ObjectId, ref: "Regulation", required: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true },
    courseCode: { type: String, required: true, trim: true, uppercase: true, unique: true },
    courseName: { type: String, required: true, trim: true },
    courseCategory: { type: Schema.Types.ObjectId, ref: "CourseCategory", required: true },

    L: { type: Number, required: true, min: 0, default: 0 },
    T: { type: Number, required: true, min: 0, default: 0 },
    P: { type: Number, required: true, min: 0, default: 0 },
    S: { type: Number, required: true, min: 0, default: 0 },
    contactHours: { type: Number, required: true, min: 0 },
    credits: { type: Number, required: true, min: 0 },

    courseType: { type: Schema.Types.ObjectId, ref: "CourseType", required: true },

    offeredByDepartment: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    offeredToDepartments: [{ type: Schema.Types.ObjectId, ref: "Department", required: true }],

    courseCoordinatorName: { type: String, required: true, trim: true },
    courseCoordinatorEmployeeId: { type: String, required: true, trim: true },

    status: { type: String, enum: COURSE_STATUS, default: "Active" },
  },
  { timestamps: true },
);

CourseSchema.index({ courseName: "text", courseCode: "text" });
CourseSchema.index({ courseCategory: 1 });
CourseSchema.index({ regulation: 1 });
CourseSchema.index({ semester: 1 });
CourseSchema.index({ offeredByDepartment: 1 });
CourseSchema.index({ offeredToDepartments: 1 });
CourseSchema.index({ status: 1 });

export type CourseDoc = InferSchemaType<typeof CourseSchema> & { _id: Types.ObjectId };

export const Course: Model<CourseDoc> = models.Course || model<CourseDoc>("Course", CourseSchema);
