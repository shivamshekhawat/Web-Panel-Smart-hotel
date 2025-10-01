// Language API Usage Example
// This file demonstrates how to use the language API endpoints

import { adminApi, CreateLanguagePayload, LanguageData } from '../services/api';

// Example: Create a new language
export const createLanguageExample = async () => {
  try {
    const languagePayload: CreateLanguagePayload = {
      language_code: 'en',
      language_name: 'English'
    };

    const response = await adminApi.createLanguage(languagePayload);
    console.log('Language created successfully:', response);
    return response;
  } catch (error) {
    console.error('Error creating language:', error);
    throw error;
  }
};

// Example: Get all languages
export const getAllLanguagesExample = async () => {
  try {
    const response = await adminApi.getAllLanguages();
    console.log('Languages fetched successfully:', response);
    return response;
  } catch (error) {
    console.error('Error fetching languages:', error);
    throw error;
  }
};

// Example: Complete workflow - create and fetch languages
export const languageWorkflowExample = async () => {
  try {
    // First, create a language
    const newLanguage = await createLanguageExample();
    console.log('Created language:', newLanguage);

    // Then, fetch all languages to see the new one
    const allLanguages = await getAllLanguagesExample();
    console.log('All languages:', allLanguages);

    return { newLanguage, allLanguages };
  } catch (error) {
    console.error('Error in language workflow:', error);
    throw error;
  }
};

// Example language data for testing
export const exampleLanguages: CreateLanguagePayload[] = [
  { language_code: 'en', language_name: 'English' },
  { language_code: 'es', language_name: 'Spanish' },
  { language_code: 'fr', language_name: 'French' },
  { language_code: 'de', language_name: 'German' },
  { language_code: 'it', language_name: 'Italian' },
  { language_code: 'pt', language_name: 'Portuguese' },
  { language_code: 'ru', language_name: 'Russian' },
  { language_code: 'ja', language_name: 'Japanese' },
  { language_code: 'ko', language_name: 'Korean' },
  { language_code: 'zh', language_name: 'Chinese' }
];

// Example: Create multiple languages
export const createMultipleLanguagesExample = async () => {
  const results = [];
  
  for (const language of exampleLanguages) {
    try {
      const response = await adminApi.createLanguage(language);
      results.push({ success: true, language, response });
      console.log(`Created language: ${language.language_name}`);
    } catch (error) {
      results.push({ success: false, language, error });
      console.error(`Failed to create language: ${language.language_name}`, error);
    }
  }
  
  return results;
};
