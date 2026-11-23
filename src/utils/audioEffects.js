
export const defaultEffects = {
  equalizer: [0, 0, 0, 0, 0],

  reverbEnabled: false,
  reverbAmount: 30,

  echoEnabled: false,
  echoDelay: 300,
  echoFeedback: 40,
  echoAmount: 35,

  bassBoostEnabled: false,
  bassBoostAmount: 50,

  spatialEnabled: false,
  spatialPan: 0,

  noiseReductionEnabled: false,
  noiseReductionAmount: 50,

  volume: 1
};

export function createEffectGraph(
  context,
  source,
  settings = defaultEffects,
  destination = context.destination
) {
  const nodes = [];

  function track(node) {
    nodes.push(node);
    return node;
  }

  // 1. Input and gentle rumble reduction
  const highPass = track(context.createBiquadFilter());

  highPass.type = "highpass";
  highPass.frequency.value = settings.noiseReductionEnabled
    ? 40 + (settings.noiseReductionAmount / 100) * 160
    : 20;

  highPass.Q.value = 0.7;

  source.connect(highPass);

  // 2. Five-band equalizer
  const frequencies = [60, 250, 1000, 4000, 12000];

  let previous = highPass;

  const equalizerFilters = frequencies.map((frequency, index) => {
    const filter = track(context.createBiquadFilter());

    filter.type = "peaking";
    filter.frequency.value = frequency;
    filter.Q.value = 1;
    filter.gain.value = settings.equalizer[index] || 0;

    previous.connect(filter);
    previous = filter;

    return filter;
  });

  // 3. Bass boost
  const bass = track(context.createBiquadFilter());

  bass.type = "lowshelf";
  bass.frequency.value = 120;

  bass.gain.value = settings.bassBoostEnabled
    ? (settings.bassBoostAmount / 100) * 18
    : 0;

  previous.connect(bass);

  // 4. Reverb
  const convolver = track(context.createConvolver());

  const impulseDuration = 2;
  const sampleRate = context.sampleRate;

  const impulse = context.createBuffer(
    2,
    Math.floor(sampleRate * impulseDuration),
    sampleRate
  );

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);

    for (let i = 0; i < channelData.length; i++) {
      const decay = Math.pow(
        1 - i / channelData.length,
        3
      );

      channelData[i] = (Math.random() * 2 - 1) * decay;
    }
  }

  convolver.buffer = impulse;

  const dryGain = track(context.createGain());
  const wetGain = track(context.createGain());

  const reverbAmount = settings.reverbEnabled
    ? settings.reverbAmount / 100
    : 0;

  dryGain.gain.value = 1 - reverbAmount * 0.35;
  wetGain.gain.value = reverbAmount;

  bass.connect(dryGain);
  bass.connect(convolver);

  convolver.connect(wetGain);

  // 5. Echo
  const delay = track(context.createDelay(1.5));
  const feedback = track(context.createGain());
  const echoGain = track(context.createGain());

  delay.delayTime.value = settings.echoDelay / 1000;

  feedback.gain.value = settings.echoEnabled
    ? Math.min(settings.echoFeedback / 100, 0.8)
    : 0;

  echoGain.gain.value = settings.echoEnabled
    ? settings.echoAmount / 100
    : 0;

  bass.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(echoGain);

  // 6. Stereo positioning
  const panner = track(context.createStereoPanner());

  panner.pan.value = settings.spatialEnabled
    ? settings.spatialPan / 100
    : 0;

  // 7. Master volume
  const masterGain = track(context.createGain());

  masterGain.gain.value = settings.volume;

  dryGain.connect(panner);
  wetGain.connect(panner);
  echoGain.connect(panner);

  panner.connect(masterGain);
  masterGain.connect(destination);

  return {
    nodes,
    equalizerFilters,
    highPass,
    bass,
    dryGain,
    wetGain,
    delay,
    feedback,
    echoGain,
    panner,
    masterGain
  };
}
