const tf = require('@tensorflow/tfjs-node');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

const storage = new Storage();
const bucketName = `${process.env.PROJECT_ID}-ml-models`;
const modelPath = 'skin-cancer-model';

async function downloadModel() {
  const modelFiles = ['model.json', 'group1-shard1of4.bin', 'group1-shard2of4.bin', 'group1-shard3of4.bin', 'group1-shard4of4.bin'];
  const localModelPath = path.join(__dirname, '../../model');

  if (!fs.existsSync(localModelPath)) {
    fs.mkdirSync(localModelPath, { recursive: true });
  }

  for (const file of modelFiles) {
    await storage.bucket(bucketName).file(`${modelPath}/${file}`)
      .download({ destination: path.join(localModelPath, file) });
  }

  return localModelPath;
}

async function loadModel() {
  const modelPath = await downloadModel();
  const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
  return model;
}

module.exports = { loadModel };