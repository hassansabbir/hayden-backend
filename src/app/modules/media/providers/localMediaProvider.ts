import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';
import { IMediaProvider, IUploadedFile, IUploadResult } from '../media.interface';
import { env } from '../../../config/env';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

export class LocalMediaProvider implements IMediaProvider {
  async upload(file: IUploadedFile): Promise<IUploadResult> {
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.originalName) || '';
    const publicId = `${crypto.randomUUID()}${ext}`;
    const destination = path.join(uploadDir, publicId);

    await fs.writeFile(destination, file.buffer);

    return {
      url: `/uploads/${publicId}`,
      publicId,
      provider: 'LOCAL',
    };
  }

  async delete(publicId: string): Promise<void> {
    const target = path.join(uploadDir, publicId);
    await fs.unlink(target).catch(() => {
      // Already gone — deleting a missing file shouldn't fail the request.
    });
  }
}
