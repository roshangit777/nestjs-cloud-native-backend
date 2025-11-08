import path from "path";
import sharp from "sharp";
import { parentPort, workerData } from "worker_threads";

interface WorkerData {
  tempPath: string;
}

async function compressImage(): Promise<void> {
  const { tempPath } = workerData as WorkerData;
  const outputPath = tempPath.replace(
    path.extname(tempPath),
    "-compressed.jpg"
  );

  await sharp(tempPath)
    .resize({ width: 1080 })
    .jpeg({ quality: 70 })
    .toFile(outputPath);

  //Force Sharp to close all internal handles. This is used for deleting the images after it is done uploading #cleanup
  sharp.cache(false);
  sharp.concurrency(1);
  sharp.simd(false);

  if (!parentPort) {
    throw new Error("Error in parentPort");
  }
  parentPort.postMessage({ success: true, path: outputPath });
}

compressImage().catch((err) => {
  if (!parentPort) {
    throw new Error("Error in parentPort");
  }
  parentPort.postMessage({ success: false, error: err.message });
});
