import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { v2 as cloudinary } from 'cloudinary';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

@Controller('upload')
export class UploadController {
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      // Use memory storage so the buffer is available for Cloudinary;
      // if Cloudinary is not configured we pipe the buffer to disk instead.
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Seules les images sont acceptées'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');

    if (isCloudinaryConfigured()) {
      return this.uploadToCloudinary(file);
    }
    return this.saveToDisk(file);
  }

  private async uploadToCloudinary(file: Express.Multer.File) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const b64 = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${b64}`;

    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'avatars',
        width: 200,
        height: 200,
        crop: 'fill',
        gravity: 'face',
      });
      return { url: result.secure_url };
    } catch {
      throw new InternalServerErrorException("Échec de l'upload Cloudinary");
    }
  }

  private saveToDisk(file: Express.Multer.File) {
    const dir = join(process.cwd(), 'public', 'avatars');
    mkdirSync(dir, { recursive: true });

    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${unique}${extname(file.originalname)}`;

    writeFileSync(join(dir, filename), file.buffer);
    return { url: `/avatars/${filename}` };
  }
}
