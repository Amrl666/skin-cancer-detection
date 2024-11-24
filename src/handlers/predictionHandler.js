const tf = require('@tensorflow/tfjs-node');
const { v4: uuidv4 } = require('uuid');
const { Firestore } = require('@google-cloud/firestore');
const { loadModel } = require('../utils/modelLoader');

const firestore = new Firestore();
let model = null;

// Load model pada startup
(async () => {
  model = await loadModel();
})();

const predictionHandler = async (request, h) => {
  try {
    const { image } = request.payload;
    
    // Convert image stream to tensor
    const imageBuffer = await image._data;
    const tensor = tf.node.decodeImage(imageBuffer, 3);
    const resized = tf.image.resizeBilinear(tensor, [224, 224]);
    const expanded = resized.expandDims(0);
    const normalized = expanded.div(255.0);

    // Predict
    const prediction = await model.predict(normalized).data();
    
    // Process result
    const probability = prediction[0];
    const result = probability > 0.5 ? 'Cancer' : 'Non-cancer';
    const suggestion = result === 'Cancer' ? 
      'Segera periksa ke dokter!' : 
      'Penyakit kanker tidak terdeteksi.';

    // Create response data
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const predictionData = {
      id,
      result,
      suggestion,
      createdAt
    };

    // Save to Firestore
    await firestore.collection('predictions').doc(id).set(predictionData);

    // Clean up tensors
    tensor.dispose();
    resized.dispose();
    expanded.dispose();
    normalized.dispose();

    return h.response({
      status: 'success',
      message: 'Model is predicted successfully',
      data: predictionData
    }).code(200);

  } catch (error) {
    console.error('Prediction error:', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan dalam melakukan prediksi'
    }).code(400);
  }
};

module.exports = { predictionHandler };
