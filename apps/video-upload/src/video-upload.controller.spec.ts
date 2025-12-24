import { Test, TestingModule } from '@nestjs/testing';
import { VideoUploadController } from './video-upload.controller';
import { VideoUploadService } from './video-upload.service';

describe('VideoUploadController', () => {
  let videoUploadController: VideoUploadController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [VideoUploadController],
      providers: [VideoUploadService],
    }).compile();

    videoUploadController = app.get<VideoUploadController>(VideoUploadController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(videoUploadController.getHello()).toBe('Hello World!');
    });
  });
});
