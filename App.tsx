import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import axios from 'axios';

const GOOGLE_API_KEY = 'AIzaSyCgyvY7fwsxKdPEMQW8adOOyoWZXnBf7XU';

const OutletNameReader = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const pickImageAndRecognize = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.7,
    });

    const asset = result.assets?.[0];

    if (!asset?.base64) {
      Alert.alert('Error', 'No image selected or base64 missing');
      return;
    }

    setImageUri(asset.uri);
    setLoading(true);

    try {
      // Step 1: Vision API to detect text
      const start = Date.now();
      const visionRes = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
        {
          requests: [
            {
              image: { content: asset.base64 },
              features: [{ type: 'TEXT_DETECTION' }],
              imageContext: {
                languageHints: ['hi', 'ta', 'te', 'kn', 'en'],
              },
            },
          ],
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const duration = Date.now() - start;
      Alert.alert(`API call took ${duration} ms`);
      const annotations = visionRes.data.responses[0]?.textAnnotations;
      if (!annotations?.length) {
        setTranslatedText('No text detected');
        return;
      }

      const detectedText = annotations[0].description;

      // Step 2: Translate detected text to English
      const translateRes = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
        {
          q: detectedText,
          target: 'en',
          format: 'text',
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const englishText = translateRes.data.data.translations[0].translatedText;
      setTranslatedText(englishText);
    } catch (error: any) {
      const duration = Date.now() - start;
      console.error('API Error:', error.response?.data || error.message);
      Alert.alert('Error', `Vision API Error: ${error.response?.data?.error?.message || error.message} API failed after ${duration} ms`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title="Capture Image and Translate" onPress={pickImageAndRecognize} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
      ) : (
        <>
          <Text style={styles.heading}>Translated Text:</Text>
          <Text style={styles.line}>{translatedText}</Text>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  image: { height: 200, marginVertical: 20 },
  heading: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
  line: { marginBottom: 6, fontSize: 15 },
});

export default OutletNameReader;
