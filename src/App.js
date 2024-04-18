import logo from './logo.svg';
import './App.css';
import { useEffect } from 'react';
import { useRive, Rive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import autoCorrelate from './autocorrelate';


// creates audio context and analyser 
// analyze, manipulate soft/loudness of audio, can plug in stuff into audio context
const audioCtx = new window.AudioContext();
console.log(audioCtx);
let analyserNode = audioCtx.createAnalyser();
const notes = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

function getNoteFromFreq(freq) {
  return Math.round(12 * (Math.log(freq / 440) / Math.log(2))) + 69;
}

function getFreqFromNote(note) {
  return 440 * Math.pow(2, (note - 69)/12);
}

function centsOffPitch(frequencyPlayed, correctFrequency) {
  return 1200 * Math.log(frequencyPlayed / correctFrequency )/ Math.log(2);
}

// requests permissions from users to use microphone
const setupMic = async () => {
  const mic = await navigator.mediaDevices.getUserMedia({
    audio:true,
    video:false,
  });
  return mic
}

function lerp(start, end, amt) {
  return amt * end + (1 - amt) * start;
}

export const start = async () => {
  let  tuningValueInput;
  const buffer = new Float32Array(analyserNode.fftSize);
  const mediaStream = await setupMic();
  const mediaSource = audioCtx.createMediaStreamSource(mediaStream);
  mediaSource.connect(analyserNode);
  analyserNode.getFloatTimeDomainData(buffer);
  console.log(buffer);
  const r = new Rive({
    src: "tuner.riv",
    canvas: document.getElementById("rive-canvas"),
    autoplay: true,
    stateMachines: "State Machine 1",
    onLoad: () => {
      const inputs = r.stateMachineInputs("State Machine 1");
      console.log(inputs);
      tuningValueInput = inputs[0];
      tuningValueInput.value = 50;
    },
  });

  function getSoundData() {
    analyserNode.getFloatTimeDomainData(buffer);
    const frequency = autoCorrelate(buffer, audioCtx.sampleRate);
    const midiPitch = getNoteFromFreq(frequency);
    const playingNote = notes[midiPitch%12];
    if (frequency > -1) {
      document
      .getElementById('playing-note')
      .replaceChildren(document.createTextNode(playingNote));
      const hzOffPitch = centsOffPitch(frequency, getFreqFromNote(midiPitch));
      
      tuningValueInput.value = lerp(tuningValueInput.value, 50 + hzOffPitch, 0.10);
    }
  }
  setInterval(getSoundData, 75);
};





function App() {

  useEffect(() => {
    start();
  }, []);
  
  
  return (
    <div className="App">
        <h1 className=''>Tuner</h1>
        <div className='w-full mx-auto'>
        <canvas id="rive-canvas" width="500" height="500"></canvas>
        <h2 id="playing-note"></h2>
        </div>
    </div>
  );
}

export default App;
