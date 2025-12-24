import { Test, TestingModule } from '@nestjs/testing';
import { VideoProcessController } from './video-process.controller';
import { VideoProcessService } from './video-process.service';

describe('VideoProcessController', () => {
  let videoProcessController: VideoProcessController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [VideoProcessController],
      providers: [VideoProcessService],
    }).compile();

    videoProcessController = app.get<VideoProcessController>(VideoProcessController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(videoProcessController.getHello()).toBe('Hello World!');
    });
  });
});
