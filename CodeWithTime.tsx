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

const GOOGLE_VISION_API_KEY = 'AIzaSyCgyvY7fwsxKdPEMQW8adOOyoWZXnBf7XU';

const OutletNameReader = () => {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [recognizedText, setRecognizedText] = useState<string[]>([]);
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
            const start = Date.now();
            const response = await axios.post(
                `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
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

            const annotations = response.data.responses[0]?.textAnnotations;
            if (annotations?.length > 0) {
                setRecognizedText(annotations[0].description.split('\n'));
            } else {
                setRecognizedText(['No text detected']);
            }
        } catch (error: any) {
            const duration = Date.now() - start;
            console.error('Vision API Error:', error.response?.data || error.message);
            Alert.alert('Error', `Vision API Error: ${error.response?.data?.error?.message || error.message} API failed after ${duration} ms`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Button title="Capture Image and Read Text" onPress={pickImageAndRecognize} />
            {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
            ) : (
                <>
                    <Text style={styles.heading}>Recognized Text:</Text>
                    {recognizedText.map((line, idx) => (
                        <Text key={idx} style={styles.line}>{line}</Text>
                    ))}
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
