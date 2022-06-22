import { model, Schema, Document } from 'mongoose';
import { App } from '@interfaces/app.interface';

const appSchema: Schema = new Schema({
  packageName: {
    type: String,
    required: true,
    unique: true,
  }
}, {
  timestamps: true
});

const appModel = model<App & Document>('App', appSchema);

export default appModel;
