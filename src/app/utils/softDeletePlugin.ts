import { Query, Schema } from 'mongoose';

// Adds isDeleted/deletedBy fields and excludes soft-deleted docs from every
// find query by default (pass { isDeleted: true } explicitly to include them).
export const softDeletePlugin = (schema: Schema): void => {
  schema.add({
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  });

  schema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
    const query = this.getQuery();
    if (query.isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  });
};
