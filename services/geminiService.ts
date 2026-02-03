import { GoogleGenAI } from "@google/genai";
import { Trip, Vehicle } from "../types";

export const generateMileageInsight = async (trips: Trip[], vehicles: Vehicle[]) => {
  // We use process.env.API_KEY directly as per SDK guidelines. 
  // We assume it is valid and configured in the environment.
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Summarize data for the prompt to avoid token limits
    const recentTrips = trips.slice(0, 50); // Analyze last 50 trips
    const vehicleNames = vehicles.map(v => `${v.year} ${v.make} ${v.model}`).join(', ');
    
    const dataSummary = JSON.stringify({
      vehicleCount: vehicles.length,
      vehicles: vehicleNames,
      tripCount: recentTrips.length,
      sampleTrips: recentTrips.map(t => ({
        date: t.date,
        distance: t.distance,
        purpose: t.destination
      }))
    });

    const prompt = `
      You are an intelligent assistant for a Mileage Tracker App called "My MileAges".
      Analyze the following mileage data summary and provide a brief, helpful insight or observation for the user.
      Focus on efficiency, patterns, or a friendly summary.
      Keep it under 3 sentences.
      
      Data: ${dataSummary}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text ?? "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights at this time. Please try again later.";
  }
};