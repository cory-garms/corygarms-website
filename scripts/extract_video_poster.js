import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const videoPath = '/home/cgarms/Sandbox/website/public/videos/cutmap/rapid_mensuration_live_demo.mp4';
const posterDest = '/home/cgarms/Sandbox/website/public/images/cutmap/rapid_mensuration_poster.jpg';

try {
  // Check ffmpeg path
  const ffmpegPath = execSync('which ffmpeg || echo ""', { encoding: 'utf8' }).trim();
  console.log('ffmpeg path:', ffmpegPath);

  if (ffmpegPath) {
    // Extract frame at 2.0s
    execSync(`${ffmpegPath} -y -ss 00:00:02 -i "${videoPath}" -vframes 1 -q:v 2 "${posterDest}"`);
    console.log('Successfully extracted poster frame to:', posterDest);
    const size = fs.statSync(posterDest).size;
    console.log('Poster size:', (size / 1024).toFixed(1), 'KB');
  } else {
    console.log('ffmpeg not found');
  }
} catch (err) {
  console.error('Error extracting frame:', err.message);
}
