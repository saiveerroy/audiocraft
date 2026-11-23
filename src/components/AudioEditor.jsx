
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import Equalizer from "./Equalizer";

import {
  Play,
  Pause,
  Scissors,
  Download,
  Volume2,
  LoaderCircle,
  RotateCcw
} from "lucide-react";

function AudioEditor({ audio }) {

  // REFERENCES

  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const filtersRef = useRef([]);
  const ffmpegRef = useRef(null);

  const bassRef = useRef(null);
  const convolverRef = useRef(null);
  const dryGainRef = useRef(null);
  const wetGainRef = useRef(null);
  const delayRef = useRef(null);
  const feedbackRef = useRef(null);
  const echoGainRef = useRef(null);
  const pannerRef = useRef(null);
  const noiseFilterRef = useRef(null);

  // STEREO WIDTH REFERENCE

  const stereoWidthRef = useRef(null);

  // PLAYBACK STATES

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [zoom, setZoom] = useState(0);

  // EXPORT STATES

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [audioQuality, setAudioQuality] = useState("192");
  const [equalizerValues, setEqualizerValues] = useState([
    0, 0, 0, 0, 0
    ]);

  // REVERB

  const [reverbEnabled, setReverbEnabled] = useState(false);
  const [reverbAmount, setReverbAmount] = useState(30);

  // ECHO

  const [echoEnabled, setEchoEnabled] = useState(false);
  const [echoDelay, setEchoDelay] = useState(300);
  const [echoFeedback, setEchoFeedback] = useState(40);
  const [echoAmount, setEchoAmount] = useState(35);

  // BASS BOOST

  const [bassBoostEnabled, setBassBoostEnabled] = useState(false);
  const [bassBoostAmount, setBassBoostAmount] = useState(50);

  // SPATIAL AUDIO

  const [spatialEnabled, setSpatialEnabled] = useState(false);
  const [spatialWidth, setSpatialWidth] = useState(100);
  const [spatialPan, setSpatialPan] = useState(0);

  // NOISE REDUCTION

  const [noiseReductionEnabled, setNoiseReductionEnabled] = useState(false);
  const [noiseReductionAmount, setNoiseReductionAmount] = useState(50);

  // RESET EFFECTS

  const [resetKey, setResetKey] = useState(0);

  

  // FORMAT TIME

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  // CREATE AUDIO EFFECTS

  function setupAudioEffects(wavesurfer) {

    if (audioContextRef.current) return;

    const context = new AudioContext();

    const audioElement = wavesurfer.getMediaElement();

    const source = context.createMediaElementSource(audioElement);

    // NOISE FILTER

    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 40;
    noiseFilter.Q.value = 0.7;

    // EQUALIZER FILTERS

    const frequencies = [60, 250, 1000, 4000, 12000];

    const filters = frequencies.map((frequency) => {
      const filter = context.createBiquadFilter();

      filter.type = "peaking";
      filter.frequency.value = frequency;
      filter.Q.value = 1;
      filter.gain.value = 0;

      return filter;
    });

    // CONNECT EQUALIZER

    source.connect(noiseFilter);
    noiseFilter.connect(filters[0]);

    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }

    const lastFilter = filters[filters.length - 1];

    // BASS BOOST

    const bass = context.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 120;
    bass.gain.value = 0;

    lastFilter.connect(bass);

    // REVERB

    const convolver = context.createConvolver();

    const sampleRate = context.sampleRate;
    const impulseDuration = 2;

    const impulse = context.createBuffer(
      2,
      sampleRate * impulseDuration,
      sampleRate
    );

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);

      for (let i = 0; i < channelData.length; i++) {
        const decay = Math.pow(1 - i / channelData.length, 3);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }

    convolver.buffer = impulse;

    const dryGain = context.createGain();
    const wetGain = context.createGain();

    bass.connect(dryGain);
    bass.connect(convolver);

    convolver.connect(wetGain);

    // ECHO

    const delay = context.createDelay(1.5);
    const feedback = context.createGain();
    const echoGain = context.createGain();

    delay.delayTime.value = 0.3;
    feedback.gain.value = 0;
    echoGain.gain.value = 0;

    bass.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(echoGain);

    // SPATIAL AUDIO

    const panner = context.createStereoPanner();

    const stereoWidthInput = context.createGain();

    const splitter = context.createChannelSplitter(2);
    const merger = context.createChannelMerger(2);

    const leftToMid = context.createGain();
    const rightToMid = context.createGain();

    const leftToSide = context.createGain();
    const rightToSide = context.createGain();

    const midBus = context.createGain();
    const sideBus = context.createGain();

    const midLeft = context.createGain();
    const midRight = context.createGain();

    const sideLeft = context.createGain();
    const sideRight = context.createGain();

    // Mid/Side conversion
    leftToMid.gain.value = 0.5;
    rightToMid.gain.value = 0.5;

    leftToSide.gain.value = 0.5;
    rightToSide.gain.value = -0.5;

    // Initial stereo width
    sideLeft.gain.value = 1;
    sideRight.gain.value = -1;

    // Connect input
    dryGain.connect(stereoWidthInput);
    wetGain.connect(stereoWidthInput);
    echoGain.connect(stereoWidthInput);

    stereoWidthInput.connect(splitter);

    // Extract Mid and Side
    splitter.connect(leftToMid, 0);
    splitter.connect(rightToMid, 1);

    splitter.connect(leftToSide, 0);
    splitter.connect(rightToSide, 1);

    // Build Mid signal
    leftToMid.connect(midBus);
    rightToMid.connect(midBus);

    // Build Side signal
    leftToSide.connect(sideBus);
    rightToSide.connect(sideBus);

    // Reconstruct stereo
    midBus.connect(midLeft);
    midBus.connect(midRight);

    sideBus.connect(sideLeft);
    sideBus.connect(sideRight);

    // Merge channels
    midLeft.connect(merger, 0, 0);
    sideLeft.connect(merger, 0, 0);

    midRight.connect(merger, 0, 1);
    sideRight.connect(merger, 0, 1);

    // Stereo panning
    merger.connect(panner);
    panner.connect(context.destination);


    // SAVE REFERENCES

    audioContextRef.current = context;
    sourceRef.current = source;
    filtersRef.current = filters;

    bassRef.current = bass;
    convolverRef.current = convolver;
    dryGainRef.current = dryGain;
    wetGainRef.current = wetGain;

    delayRef.current = delay;
    feedbackRef.current = feedback;
    echoGainRef.current = echoGain;

    pannerRef.current = panner;

    stereoWidthRef.current = {
        sideLeft,
        sideRight
    };
    noiseFilterRef.current = noiseFilter;
  }

  // LOAD AUDIO WAVEFORM

  useEffect(() => {

    if (!audio?.url || !waveformRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#7959B5",
      progressColor: "#B99AFF",
      cursorColor: "#FFFFFF",
      height: 120,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      normalize: true
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.load(audio.url);

    wavesurfer.on("ready", () => {

      const audioDuration = wavesurfer.getDuration();

      setDuration(audioDuration);
      setStartTime(0);
      setEndTime(audioDuration);

      setupAudioEffects(wavesurfer);

    });

    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("finish", () => setIsPlaying(false));

    wavesurfer.on("timeupdate", (time) => {
      setCurrentTime(time);
    });

    return () => {

      wavesurfer.destroy();
      wavesurferRef.current = null;

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      audioContextRef.current = null;
      sourceRef.current = null;
      filtersRef.current = [];

    };

  }, [audio?.url]);

  
  // PLAY / PAUSE

  function togglePlayback() {
    const wavesurfer = wavesurferRef.current;

    if (!wavesurfer) return;

    audioContextRef.current?.resume();

    if (wavesurfer.isPlaying()) {
      wavesurfer.pause();
    } else {
      wavesurfer.play(startTime, endTime);
    }
  }

  // PREVIEW SELECTED AUDIO

  function previewSelection() {
    const wavesurfer = wavesurferRef.current;

    if (!wavesurfer) return;

    audioContextRef.current?.resume();
    wavesurfer.pause();
    wavesurfer.play(startTime, endTime);
  }

  // VOLUME

  function changeVolume(event) {
    const newVolume = Number(event.target.value);

    setVolume(newVolume);
    wavesurferRef.current?.setVolume(newVolume);
  }

  // ZOOM

  function changeZoom(value) {
    const nextZoom = Math.max(0, Math.min(200, Number(value)));

    setZoom(nextZoom);
    wavesurferRef.current?.zoom(nextZoom);
  }

  // EQUALIZER

  function applyEqualizer(frequencies) {

        const values = frequencies.map(item => item.value);

        setEqualizerValues(values);

        if (!audioContextRef.current) return;

        frequencies.forEach((item, index) => {

            const filter = filtersRef.current[index];

            if (filter) {

                filter.gain.setTargetAtTime(
                    item.value,
                    audioContextRef.current.currentTime,
                    0.01
                );

            }

        });

    }

  // REVERB

  function changeReverb(enabled) {
    setReverbEnabled(enabled);

    if (!audioContextRef.current) return;

    const context = audioContextRef.current;
    const amount = enabled ? reverbAmount / 100 : 0;

    wetGainRef.current?.gain.setTargetAtTime(
      amount,
      context.currentTime,
      0.05
    );

    dryGainRef.current?.gain.setTargetAtTime(
      1 - amount * 0.5,
      context.currentTime,
      0.05
    );
  }

  function updateReverbAmount(value) {
    const amount = Number(value);

    setReverbAmount(amount);

    if (reverbEnabled && audioContextRef.current) {
      const context = audioContextRef.current;

      wetGainRef.current?.gain.setTargetAtTime(
        amount / 100,
        context.currentTime,
        0.05
      );

      dryGainRef.current?.gain.setTargetAtTime(
        1 - (amount / 100) * 0.5,
        context.currentTime,
        0.05
      );
    }
  }

  // ECHO

  function updateEcho() {
    if (!audioContextRef.current) return;

    const context = audioContextRef.current;

    if (delayRef.current) {
      delayRef.current.delayTime.setTargetAtTime(
        echoDelay / 1000,
        context.currentTime,
        0.05
      );
    }

    if (feedbackRef.current) {
      feedbackRef.current.gain.setTargetAtTime(
        echoEnabled ? echoFeedback / 100 : 0,
        context.currentTime,
        0.05
      );
    }

    if (echoGainRef.current) {
      echoGainRef.current.gain.setTargetAtTime(
        echoEnabled ? echoAmount / 100 : 0,
        context.currentTime,
        0.05
      );
    }
    
  }

  useEffect(() => {
        updateEcho();
        }, [
        echoEnabled,
        echoDelay,
        echoFeedback,
        echoAmount
        ]);

  function toggleEcho(enabled) {
        setEchoEnabled(enabled);

        const context = audioContextRef.current;

        if (!context) return;

        feedbackRef.current?.gain.setTargetAtTime(
            enabled ? echoFeedback / 100 : 0,
            context.currentTime,
            0.05
        );

        echoGainRef.current?.gain.setTargetAtTime(
            enabled ? echoAmount / 100 : 0,
            context.currentTime,
            0.05
        );
    }

  // BASS BOOST

  function updateBassBoost(enabled) {
    setBassBoostEnabled(enabled);

    if (!audioContextRef.current || !bassRef.current) return;

    bassRef.current.gain.setTargetAtTime(
      enabled ? (bassBoostAmount / 100) * 18 : 0,
      audioContextRef.current.currentTime,
      0.05
    );
  }

  function changeBassBoostAmount(value) {
    const amount = Number(value);

    setBassBoostAmount(amount);

    if (bassBoostEnabled && audioContextRef.current) {
      bassRef.current?.gain.setTargetAtTime(
        (amount / 100) * 18,
        audioContextRef.current.currentTime,
        0.05
      );
    }
  }

  // SPATIAL AUDIO

  
    
        function updateSpatialAudio() {
            if (!audioContextRef.current || !pannerRef.current) return;

            const context = audioContextRef.current;

            const width = spatialEnabled
                ? spatialWidth / 100
                : 1;

            const pan = spatialEnabled
                ? spatialPan / 100
                : 0;

            // Update stereo width
            if (stereoWidthRef.current) {
                stereoWidthRef.current.sideLeft.gain.setTargetAtTime(
                width,
                context.currentTime,
                0.05
                );

                stereoWidthRef.current.sideRight.gain.setTargetAtTime(
                -width,
                context.currentTime,
                0.05
                );
            }

            // Update stereo pan
            pannerRef.current.pan.setTargetAtTime(
                pan,
                context.currentTime,
                0.05
            );
        }



  function toggleSpatial(enabled) {
    setSpatialEnabled(enabled);

    if (!audioContextRef.current || !pannerRef.current) return;

    pannerRef.current.pan.setTargetAtTime(
      enabled ? spatialPan / 100 : 0,
      audioContextRef.current.currentTime,
      0.05
    );
  }

  // NOISE REDUCTION

  function updateNoiseReduction(enabled) {
    setNoiseReductionEnabled(enabled);

    if (!audioContextRef.current || !noiseFilterRef.current) return;

    const frequency = enabled
      ? 40 + (noiseReductionAmount / 100) * 160
      : 40;

    noiseFilterRef.current.frequency.setTargetAtTime(
      frequency,
      audioContextRef.current.currentTime,
      0.05
    );
  }

  function changeNoiseReduction(value) {
    const amount = Number(value);

    setNoiseReductionAmount(amount);

    if (noiseReductionEnabled && audioContextRef.current) {
      noiseFilterRef.current?.frequency.setTargetAtTime(
        40 + (amount / 100) * 160,
        audioContextRef.current.currentTime,
        0.05
      );
    }
  }

  // RESET ALL AUDIO EFFECTS

    function resetAllEffects() {

        // Reset Equalizer
        setEqualizerValues([0, 0, 0, 0, 0]);
        setResetKey(prev => prev + 1);

        // Reset Reverb
        setReverbEnabled(false);
        setReverbAmount(30);

        // Reset Echo
        setEchoEnabled(false);
        setEchoDelay(300);
        setEchoFeedback(40);
        setEchoAmount(35);

        // Reset Bass Boost
        setBassBoostEnabled(false);
        setBassBoostAmount(50);

        // Reset Spatial Audio
        setSpatialEnabled(false);
        setSpatialWidth(100);
        setSpatialPan(0);

        // Reset Noise Reduction
        setNoiseReductionEnabled(false);
        setNoiseReductionAmount(50);

        // Reset live audio processing
        const context = audioContextRef.current;

        if (context) {

            // Equalizer
            filtersRef.current.forEach(filter => {
            filter.gain.setTargetAtTime(
                0,
                context.currentTime,
                0.01
            );
            });

            // Reverb
            wetGainRef.current?.gain.setTargetAtTime(
            0,
            context.currentTime,
            0.05
            );

            dryGainRef.current?.gain.setTargetAtTime(
            1,
            context.currentTime,
            0.05
            );

            // Echo
            feedbackRef.current?.gain.setTargetAtTime(
            0,
            context.currentTime,
            0.05
            );

            echoGainRef.current?.gain.setTargetAtTime(
            0,
            context.currentTime,
            0.05
            );

            delayRef.current?.delayTime.setTargetAtTime(
            0.3,
            context.currentTime,
            0.05
            );

            // Bass Boost
            bassRef.current?.gain.setTargetAtTime(
            0,
            context.currentTime,
            0.05
            );

            // Spatial Audio
            pannerRef.current?.pan.setTargetAtTime(
            0,
            context.currentTime,
            0.05
            );

            // Noise Reduction
            noiseFilterRef.current?.frequency.setTargetAtTime(
            40,
            context.currentTime,
            0.05
            );

        }

        setMessage("All audio effects have been reset!");

    }

  // RESET TRIM

  function resetSelection() {
    setStartTime(0);
    setEndTime(duration);

    wavesurferRef.current?.setTime(0);
  }

  // UPDATE TRIM START

  function updateStart(value) {
    const newStart = Math.max(
      0,
      Math.min(Number(value), endTime - 0.1)
    );

    setStartTime(newStart);
  }

  // UPDATE TRIM END

  function updateEnd(value) {
    const newEnd = Math.min(
      duration,
      Math.max(Number(value), startTime + 0.1)
    );

    setEndTime(newEnd);
  }

  // LOAD FFMPEG

  async function loadEditorFFmpeg() {
    if (ffmpegRef.current) {
      return ffmpegRef.current;
    }

    const ffmpeg = new FFmpeg();

    const coreURL = await toBlobURL(
      "/ffmpeg/ffmpeg-core.js",
      "text/javascript"
    );

    const wasmURL = await toBlobURL(
      "/ffmpeg/ffmpeg-core.wasm",
      "application/wasm"
    );

    await ffmpeg.load({
      coreURL,
      wasmURL
    });

    ffmpegRef.current = ffmpeg;

    return ffmpeg;
  }

  // PROCESS AUDIO WITH EFFECTS

  
    async function processAudioWithEffects() {

        if (!audio?.url) {
            throw new Error("No audio file selected.");
        }

        setMessage("Applying audio effects...");

        // Load original audio
        const response = await fetch(audio.url);
        const arrayBuffer = await response.arrayBuffer();

        // Decode audio
        const decodeContext = new AudioContext();

        const audioBuffer = await decodeContext.decodeAudioData(
            arrayBuffer
        );

        await decodeContext.close();

        const sampleRate = audioBuffer.sampleRate;

        // Create offline audio context
        const offlineContext = new OfflineAudioContext(
            2,
            audioBuffer.length,
            sampleRate
        );

        // Convert mono audio into stereo when necessary
        let processingBuffer = audioBuffer;

        if (audioBuffer.numberOfChannels === 1) {

        processingBuffer = offlineContext.createBuffer(
            2,
            audioBuffer.length,
            sampleRate
        );

        const monoData = audioBuffer.getChannelData(0);

        processingBuffer.copyToChannel(monoData, 0);
        processingBuffer.copyToChannel(monoData, 1);

        }

        const source = offlineContext.createBufferSource();

        source.buffer = processingBuffer;

        // Equalizer filters
        const frequencies = [60, 250, 1000, 4000, 12000];

        let previousNode = source;

        frequencies.forEach((frequency, index) => {

            const filter = offlineContext.createBiquadFilter();

            filter.type = "peaking";
            filter.frequency.value = frequency;
            filter.Q.value = 1;
            filter.gain.value = equalizerValues[index] || 0;

            previousNode.connect(filter);
            previousNode = filter;

        });

        // Bass boost
        const bass = offlineContext.createBiquadFilter();

        bass.type = "lowshelf";
        bass.frequency.value = 120;

        bass.gain.value = bassBoostEnabled
            ? (bassBoostAmount / 100) * 18
            : 0;

        previousNode.connect(bass);

        // Reverb
        const convolver = offlineContext.createConvolver();

        const impulseDuration = 2;

        const impulse = offlineContext.createBuffer(
            2,
            sampleRate * impulseDuration,
            sampleRate
        );

        for (let channel = 0; channel < 2; channel++) {

            const channelData = impulse.getChannelData(channel);

            for (let i = 0; i < channelData.length; i++) {

            const decay = Math.pow(
                1 - i / channelData.length,
                3
            );

            channelData[i] =
                (Math.random() * 2 - 1) * decay;

            }

        }

        convolver.buffer = impulse;

        const dryGain = offlineContext.createGain();
        const wetGain = offlineContext.createGain();

        const reverbAmountValue = reverbEnabled
            ? reverbAmount / 100
            : 0;

        dryGain.gain.value = 1 - reverbAmountValue * 0.5;
        wetGain.gain.value = reverbAmountValue;

        bass.connect(dryGain);
        bass.connect(convolver);

        convolver.connect(wetGain);

        // Mix dry and wet signals
        const reverbMix = offlineContext.createGain();

        dryGain.connect(reverbMix);
        wetGain.connect(reverbMix);

        // ECHO PROCESSING

        const delay = offlineContext.createDelay(1.5);
        const feedback = offlineContext.createGain();
        const echoGain = offlineContext.createGain();

        delay.delayTime.value = echoDelay / 1000;

        feedback.gain.value = echoEnabled
            ? echoFeedback / 100
            : 0;

        echoGain.gain.value = echoEnabled
            ? echoAmount / 100
            : 0;

        // Preserve original audio
        const echoMix = offlineContext.createGain();

        reverbMix.connect(echoMix);

        // Create echo path
        reverbMix.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(echoGain);

        // Mix echo with original audio
        
        echoGain.connect(echoMix);

        
        
        // SPATIAL AUDIO: STEREO WIDTH AND PAN

        const width = spatialEnabled
        ? spatialWidth / 100
        : 1;

        const panValue = spatialEnabled
        ? spatialPan / 100
        : 0;

        const splitter = offlineContext.createChannelSplitter(2);
        const merger = offlineContext.createChannelMerger(2);

        const leftToMid = offlineContext.createGain();
        const rightToMid = offlineContext.createGain();

        const leftToSide = offlineContext.createGain();
        const rightToSide = offlineContext.createGain();

        const midBus = offlineContext.createGain();
        const sideBus = offlineContext.createGain();

        const midLeft = offlineContext.createGain();
        const midRight = offlineContext.createGain();

        const sideLeft = offlineContext.createGain();
        const sideRight = offlineContext.createGain();

        const pan = offlineContext.createStereoPanner();

        // Mid/Side conversion
        leftToMid.gain.value = 0.5;
        rightToMid.gain.value = 0.5;

        leftToSide.gain.value = 0.5;
        rightToSide.gain.value = -0.5;

        // Stereo width
        sideLeft.gain.value = width;
        sideRight.gain.value = -width;

        // Split stereo channels
        echoMix.connect(splitter);

        splitter.connect(leftToMid, 0);
        splitter.connect(rightToMid, 1);

        splitter.connect(leftToSide, 0);
        splitter.connect(rightToSide, 1);

        // Mid signal
        leftToMid.connect(midBus);
        rightToMid.connect(midBus);

        // Side signal
        leftToSide.connect(sideBus);
        rightToSide.connect(sideBus);

        // Reconstruct stereo
        midBus.connect(midLeft);
        midBus.connect(midRight);

        sideBus.connect(sideLeft);
        sideBus.connect(sideRight);

        // Merge stereo channels
        midLeft.connect(merger, 0, 0);
        sideLeft.connect(merger, 0, 0);

        midRight.connect(merger, 0, 1);
        sideRight.connect(merger, 0, 1);

        // Apply pan
        merger.connect(pan);

        pan.pan.value = panValue;


        
// NOISE REDUCTION + NOISE GATE

const noiseFilter = offlineContext.createBiquadFilter();

noiseFilter.type = "highpass";

noiseFilter.frequency.value = noiseReductionEnabled
  ? 40 + (noiseReductionAmount / 100) * 160
  : 40;

noiseFilter.Q.value = 0.7;

        // Noise gate
        const noiseGate = offlineContext.createDynamicsCompressor();

        noiseGate.threshold.value = noiseReductionEnabled
        ? -55 + (noiseReductionAmount / 100) * 25
        : 0;

        noiseGate.knee.value = 6;
        noiseGate.ratio.value = noiseReductionEnabled ? 12 : 1;
        noiseGate.attack.value = 0.01;
        noiseGate.release.value = 0.15;

       // Connect processed audio correctly
        pan.connect(noiseFilter);

        noiseFilter.connect(noiseGate);

        // Connect echo into the processing chain
        echoGain.connect(noiseFilter);

        // Create limiter BEFORE connecting to it
        const limiter = offlineContext.createDynamicsCompressor();

        limiter.threshold.value = -3;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.15;

        // Final output
        noiseGate.connect(limiter);

        limiter.connect(offlineContext.destination);



        // Render processed audio
        source.start(0);

        setMessage("Rendering audio effects...");

        const renderedBuffer = await offlineContext.startRendering();

        return renderedBuffer;
    }


  // DOWNLOAD TRIMMED AUDIO

  
    async function downloadTrimmedAudio() {

        if (!audio?.url || endTime <= startTime) {
            setMessage("Please select a valid audio section.");
            return;
        }

        try {

            setLoading(true);
            setMessage("Processing audio effects...");

            // Step 1: Process audio with selected effects
            const processedBuffer = await processAudioWithEffects();

            // Step 2: Create WAV file from processed audio
            const wavBlob = audioBufferToWav(processedBuffer);

            // Step 3: Load FFmpeg
            const ffmpeg = await loadEditorFFmpeg();

            // Step 4: Remove previous temporary files
            for (const file of [
            "editor-input.wav",
            "trimmed-output.mp3"
            ]) {
            try {
                await ffmpeg.deleteFile(file);
            } catch {
                // Ignore missing files
            }
            }

            // Step 5: Write processed audio into FFmpeg
            await ffmpeg.writeFile(
            "editor-input.wav",
            await fetchFile(wavBlob)
            );

            setMessage("Exporting processed MP3...");

            // Step 6: Trim and export
            await ffmpeg.exec([
            "-i", "editor-input.wav",
            "-ss", startTime.toFixed(3),
            "-t", (endTime - startTime).toFixed(3),
            "-vn",
            "-codec:a", "libmp3lame",
            "-b:a", `${audioQuality}k`,
            "trimmed-output.mp3"
            ]);

            // Step 7: Read exported MP3
            const data = await ffmpeg.readFile("trimmed-output.mp3");

            const blob = new Blob(
            [data],
            { type: "audio/mpeg" }
            );

            const url = URL.createObjectURL(blob);

            // Step 8: Download
            const link = document.createElement("a");

            link.href = url;
            link.download = `audiocraft-effects-${audioQuality}kbps.mp3`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 1000);

            setMessage("MP3 exported successfully with audio effects!");

        } catch (error) {

            console.error("Audio export error:", error);

            setMessage("Export failed: " + error.message);

        } finally {

            setLoading(false);

        }
    }



  // NO AUDIO SELECTED

  if (!audio) return null;

  
  return (
    <div style={{
      background: "#191625",
      border: "1px solid #332A49",
      borderRadius: "16px",
      padding: "24px",
      marginTop: "24px",
      color: "#F5F3FF"
    }}>

      {/* HEADER */}

      <h2 style={{ fontSize: "20px", margin: 0 }}>
        Audio Editor
      </h2>

      <p style={{ color: "#9994AA", fontSize: "13px" }}>
        {audio.name}
      </p>

      {/* WAVEFORM */}

      <div style={{
        background: "#100E19",
        borderRadius: "12px",
        padding: "20px 12px",
        marginTop: "20px"
      }}>
        <div ref={waveformRef} />
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        color: "#B99AFF",
        fontSize: "13px",
        marginTop: "10px"
      }}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* PLAYBACK */}

      <div style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginTop: "20px"
      }}>

        <button onClick={togglePlayback} style={buttonStyle("#8957F5")}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? "Pause" : "Play"}
        </button>

        <button onClick={previewSelection} style={buttonStyle("#302447")}>
          <Play size={17} />
          Preview Selection
        </button>

        <button onClick={resetSelection} style={buttonStyle("#302447")}>
          <RotateCcw size={17} />
          Reset
        </button>

      </div>

      {/* ZOOM */}

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginTop: "24px"
      }}>
        <span>Zoom</span>

        <button
          onClick={() => changeZoom(zoom - 10)}
          style={buttonStyle("#302447")}
        >
          -
        </button>

        <input
          type="range"
          min="0"
          max="200"
          value={zoom}
          onChange={(event) => changeZoom(event.target.value)}
          style={{ flex: 1, accentColor: "#8957F5" }}
        />

        <button
          onClick={() => changeZoom(zoom + 10)}
          style={buttonStyle("#302447")}
        >
          +
        </button>
      </div>

      {/* TRIM AUDIO */}

      <section style={sectionStyle}>
        <h3><Scissors size={18} /> Trim Audio</h3>

        <label style={labelStyle}>
          Start Time: {startTime.toFixed(1)} seconds
        </label>

        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={startTime}
          onChange={(event) => updateStart(event.target.value)}
          style={rangeStyle}
        />

        <label style={labelStyle}>
          End Time: {endTime.toFixed(1)} seconds
        </label>

        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={endTime}
          onChange={(event) => updateEnd(event.target.value)}
          style={rangeStyle}
        />

        <p style={{ color: "#B99AFF", fontSize: "13px" }}>
          Selected duration: {formatTime(endTime - startTime)}
        </p>
      </section>

      {/* VOLUME */}

      <section style={sectionStyle}>
        <h3><Volume2 size={18} /> Volume Control</h3>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={changeVolume}
          style={rangeStyle}
        />

        <p>{Math.round(volume * 100)}%</p>
      </section>

      {/* EQUALIZER */}

      <Equalizer key={resetKey} onChange={applyEqualizer}/>

      {/* RESET ALL EFFECTS */}

        <button
        onClick={resetAllEffects}
        style={{
            ...buttonStyle("#49356D"),
            width: "100%",
            justifyContent: "center",
            marginTop: "20px"
        }}
        >
        <RotateCcw size={18} />
        Reset All Effects
        </button>

      {/* REVERB */}

      <section style={sectionStyle}>
        <h3>Reverb Effect</h3>

        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={reverbEnabled}
            onChange={(event) => changeReverb(event.target.checked)}
          />
          {" "}Enable Reverb
        </label>

        <label style={labelStyle}>
          Reverb Amount: {reverbAmount}%
        </label>

        <input
          type="range"
          min="0"
          max="100"
          value={reverbAmount}
          onChange={(event) => updateReverbAmount(event.target.value)}
          style={rangeStyle}
        />
      </section>

      {/* ECHO */}

      <section style={sectionStyle}>
        <h3>Echo Effect</h3>

        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={echoEnabled}
            onChange={(event) => toggleEcho(event.target.checked)}
          />
          {" "}Enable Echo
        </label>

        <label style={labelStyle}>
          Echo Delay: {echoDelay} ms
        </label>

        <input
          type="range"
          min="50"
          max="1000"
          value={echoDelay}
          onChange={(event) => setEchoDelay(Number(event.target.value))}
          style={rangeStyle}
        />

        <label style={labelStyle}>
          Feedback: {echoFeedback}%
        </label>

        <input
          type="range"
          min="0"
          max="80"
          value={echoFeedback}
          onChange={(event) => setEchoFeedback(Number(event.target.value))}
          style={rangeStyle}
        />

        <label style={labelStyle}>
          Echo Amount: {echoAmount}%
        </label>

        <input
          type="range"
          min="0"
          max="100"
          value={echoAmount}
          onChange={(event) => setEchoAmount(Number(event.target.value))}
          style={rangeStyle}
        />

        
      </section>

      {/* BASS BOOST */}

      <section style={sectionStyle}>
        <h3>Bass Boost</h3>

        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={bassBoostEnabled}
            onChange={(event) => updateBassBoost(event.target.checked)}
          />
          {" "}Enable Bass Boost
        </label>

        <label style={labelStyle}>
          Bass Intensity: {bassBoostAmount}%
        </label>

        <input
          type="range"
          min="0"
          max="100"
          value={bassBoostAmount}
          onChange={(event) => changeBassBoostAmount(event.target.value)}
          style={rangeStyle}
        />
      </section>

      {/* SPATIAL AUDIO */}

      <section style={sectionStyle}>
        <h3>3D Spatial Audio</h3>

        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={spatialEnabled}
            onChange={(event) => toggleSpatial(event.target.checked)}
          />
          {" "}Enable Spatial Audio
        </label>

        
        <label style={labelStyle}>
        Stereo Width: {spatialWidth}%
        </label>

        <input
        type="range"
        min="0"
        max="200"
        value={spatialWidth}
        onChange={(event) => {
            setSpatialWidth(Number(event.target.value));
            if (spatialEnabled) {
                setTimeout(updateSpatialAudio, 0);
            }
        }}
        style={rangeStyle}
        />

        <p style={{
        color: "#9994AA",
        fontSize: "12px"
        }}>
        0% = Mono | 100% = Normal | 200% = Extra Wide
        </p>


        <input
          type="range"
          min="-100"
          max="100"
          value={spatialPan}
          onChange={(event) => {
            const value = Number(event.target.value);

            setSpatialPan(value);

            if (spatialEnabled && audioContextRef.current) {
                pannerRef.current?.pan.setTargetAtTime(
                value / 100,
                audioContextRef.current.currentTime,
                0.05
                );
            }
            }}
          style={rangeStyle}
        />
      </section>

      {/* NOISE REDUCTION */}

      <section style={sectionStyle}>
        <h3>Noise Reduction</h3>

        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={noiseReductionEnabled}
            onChange={(event) =>
              updateNoiseReduction(event.target.checked)
            }
          />
          {" "}Enable Noise Reduction
        </label>

        <label style={labelStyle}>
          Reduction Amount: {noiseReductionAmount}%
        </label>

        <input
          type="range"
          min="0"
          max="200"
          value={noiseReductionAmount}
          onChange={(event) =>
            changeNoiseReduction(event.target.value)
          }
          style={rangeStyle}
        />
      </section>

      {/* MP3 EXPORT */}

      <section style={sectionStyle}>
        <h3>MP3 Export Quality</h3>

        <select
          value={audioQuality}
          onChange={(event) => setAudioQuality(event.target.value)}
          style={inputStyle}
        >
          <option value="128">128 kbps - Small File</option>
          <option value="192">192 kbps - Balanced</option>
          <option value="320">320 kbps - High Quality</option>
        </select>
      </section>

      <button
        onClick={downloadTrimmedAudio}
        disabled={loading || duration === 0}
        style={{
          ...buttonStyle("#8957F5"),
          width: "100%",
          justifyContent: "center",
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading
          ? <LoaderCircle size={18} />
          : <Download size={18} />
        }

        {loading ? "Processing Audio..." : "Download Trimmed MP3"}
      </button>

      {message && (
        <p style={{
          color: "#B99AFF",
          textAlign: "center",
          fontSize: "13px"
        }}>
          {message}
        </p>
      )}

    </div>
  );
}

// CONVERT AUDIO BUFFER TO WAV

    function audioBufferToWav(buffer) {

    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;

    const bytesPerSample = bitsPerSample / 8;

    const blockAlign = numberOfChannels * bytesPerSample;

    const dataLength =
        buffer.length * blockAlign;

    const arrayBuffer = new ArrayBuffer(44 + dataLength);

    const view = new DataView(arrayBuffer);

    function writeString(offset, string) {
        for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");

    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);

    view.setUint32(
        28,
        sampleRate * blockAlign,
        true
    );

    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    let offset = 44;

    for (let i = 0; i < buffer.length; i++) {

        for (let channel = 0; channel < numberOfChannels; channel++) {

        let sample = buffer.getChannelData(channel)[i];

        sample = Math.max(-1, Math.min(1, sample));

        const value = sample < 0
            ? sample * 0x8000
            : sample * 0x7FFF;

        view.setInt16(offset, value, true);

        offset += 2;

        }

    }

    return new Blob(
        [arrayBuffer],
        { type: "audio/wav" }
    );

    }


const buttonStyle = (background) => ({
  background,
  color: "#FFFFFF",
  border: "1px solid #49356D",
  borderRadius: "9px",
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: "9px",
  cursor: "pointer",
  fontSize: "13px"
});

const sectionStyle = {
  background: "#211C32",
  borderRadius: "12px",
  padding: "20px",
  marginTop: "20px"
};

const labelStyle = {
  display: "block",
  color: "#BDB5D0",
  fontSize: "13px",
  marginTop: "14px",
  marginBottom: "8px"
};

const rangeStyle = {
  width: "100%",
  accentColor: "#8957F5"
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px",
  borderRadius: "8px",
  border: "1px solid #49356D",
  background: "#100E19",
  color: "#FFFFFF"
};

export default AudioEditor;
