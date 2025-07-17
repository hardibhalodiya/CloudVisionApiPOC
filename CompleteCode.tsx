import React, { useState } from 'react';
import {
    View,
    Text,
    Button,
    Image,
    ScrollView,
    StyleSheet,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import axios from 'axios';
import { Buffer } from 'buffer';
import {
    PERMISSIONS,
    request,
    check,
    RESULTS,
    openSettings,
} from 'react-native-permissions';

global.Buffer = Buffer;

const GOOGLE_VISION_API_KEY = 'AIzaSyA6KeNdqqGc70NbTFQxBvvcBzwITp8xMNQ';

const OutletNameReader = () => {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [recognizedText, setRecognizedText] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const requestPhotoPermission = async (): Promise<boolean> => {
        const permission =
            Platform.OS === 'ios'
                ? PERMISSIONS.IOS.PHOTO_LIBRARY
                : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

        const result = await check(permission);

        if (result === RESULTS.GRANTED) return true;
        if (result === RESULTS.BLOCKED) {
            Alert.alert(
                'Permission Required',
                'Please enable photo permission in settings.',
                [{ text: 'Open Settings', onPress: openSettings }]
            );
            return false;
        }

        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
    };

    const pickImageAndRecognize = async () => {
        // const granted = await requestPhotoPermission();
        // if (!granted) return;

        const result = await launchCamera({
            mediaType: 'photo',
            includeBase64: true,
            quality: 0.5,
            maxWidth: 800,
            maxHeight: 800
        });
        const asset = result.assets?.[0];

        if (!asset?.base64) {
            Alert.alert('Error', 'No image selected');
            return;
        }

        setImageUri(asset.uri);
        // Alert.alert('asset.uri', JSON.stringify(asset.uri, null, 2));
        setLoading(true);
        try {
            const res = await axios.post(
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

            const textAnnotations = res.data.responses[0]?.textAnnotations;
            if (textAnnotations && textAnnotations.length > 0) {
                const fullText = textAnnotations[0].description;
                const lines = fullText.split('\n');
                setLoading(false);
                setRecognizedText(lines);
            } else {
                setLoading(false);
                setRecognizedText(['No text detected']);
            }
        } catch (error) {
            console.error('Vision API error:', error);
            Alert.alert('Error', 'Vision API error:' + error);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Button title="Pick Image and Read Text" onPress={pickImageAndRecognize} />
            {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
            ) : (
                <>
                    <Text style={styles.heading}>Recognized Text:</Text>
                    {recognizedText.map((line, index) => (
                        <Text key={index} style={styles.line}>{line}</Text>
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
