import { useState, useEffect, useRef } from "react";
import { SlidersHorizontal, RotateCcw, AudioWaveform } from "lucide-react";

function Equalizer({ onChange, audioRef, audioUrl }) {
  const [frequencies, setFrequencies] = useState([
  { label: "Sub Bass", hz: "60 Hz", frequency: 60, value: 0 },
  { label: "Bass", hz: "250 Hz", frequency: 250, value: 0 },
  { label: "Midrange", hz: "1 kHz", frequency: 1000, value: 0 },
  { label: "Presence", hz: "4 kHz", frequency: 4000, value: 0 },
  { label: "Treble", hz: "12 kHz", frequency: 12000, value: 0 }
]);

  const presets = {
    "Flat": [0, 0, 0, 0, 0],
    "Bass Boost": [8, 6, 0, 1, 2],
    "Vocal Clarity": [-2, 0, 5, 6, 2],
    "Podcast": [2, 3, 5, 4, 1],
    "Rock": [5, 3, -1, 4, 6],
    "Classical": [2, 1, 0, 3, 4],
    "Pop": [4, 3, 1, 3, 4],
    "Treble Boost": [-2, 0, 1, 5, 8]
  };

  
    const filtersRef = useRef([]);
    
    const contextRef = useRef(null);

    useEffect(() => {
    const audio = audioRef?.current;

    if (!audio || !audioUrl) return;

    const context = new (
        window.AudioContext || window.webkitAudioContext
    )();

    const source = context.createMediaElementSource(audio);

    const filters = frequencies.map((item, index) => {
        const filter = context.createBiquadFilter();

        filter.type =
        index === 0 ? "lowshelf" :
        index === 4 ? "highshelf" :
        "peaking";

        filter.frequency.value = item.frequency;
        filter.gain.value = item.value;
        filter.Q.value = 1;

        return filter;
    });

    source.connect(filters[0]);

    filters.forEach((filter, index) => {
        if (index < filters.length - 1) {
        filter.connect(filters[index + 1]);
        }
    });

    filters[filters.length - 1].connect(context.destination);

    filtersRef.current = filters;
    contextRef.current = context;

    return () => {
        source.disconnect();
        filters.forEach(filter => filter.disconnect());
        filtersRef.current = [];
        contextRef.current = null;
        context.close();
    };
    }, [audioRef, audioUrl]);

    useEffect(() => {
    if (!contextRef.current) return;

    frequencies.forEach((item, index) => {
        const filter = filtersRef.current[index];

        if (filter) {
        filter.gain.setTargetAtTime(
            item.value,
            contextRef.current.currentTime,
            0.01
        );
        }
    });
    }, [frequencies]);


  function updateFrequency(index, value) {
    const updated = frequencies.map((item, i) =>
      i === index ? { ...item, value: Number(value) } : item
    );

    setFrequencies(updated);
    onChange?.(updated);
  }

  function applyPreset(presetName) {
    const values = presets[presetName];

    const updated = frequencies.map((item, index) => ({
      ...item,
      value: values[index]
    }));

    setFrequencies(updated);
    onChange?.(updated);
  }

  function resetEqualizer() {
    const reset = frequencies.map(item => ({
      ...item,
      value: 0
    }));

    setFrequencies(reset);
    onChange?.(reset);
  }

  const panelStyle = {
    background: "#191525",
    border: "1px solid #35284F",
    borderRadius: "16px",
    padding: "22px",
    marginTop: "20px",
    color: "#F5F3FF"
  };

  const buttonStyle = {
    background: "#29203D",
    border: "1px solid #493566",
    color: "#D8C6FF",
    borderRadius: "8px",
    padding: "9px 13px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600"
  };

  return (
    <div style={panelStyle}>

      {/* HEADER */}

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "22px"
      }}>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>

          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #8957F5, #5D35B5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <SlidersHorizontal size={21} color="white" />
          </div>

          <div>
            <h3 style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: "700"
            }}>
              Audio Equalizer
            </h3>

            <p style={{
              color: "#9589AA",
              fontSize: "11px",
              margin: "5px 0 0"
            }}>
              Fine-tune your sound frequencies
            </p>
          </div>

        </div>

        <button
          onClick={resetEqualizer}
          style={{
            ...buttonStyle,
            display: "flex",
            alignItems: "center",
            gap: "7px"
          }}
        >
          <RotateCcw size={14} />
          Reset
        </button>

      </div>

      {/* PRESETS */}

      <div style={{ marginBottom: "22px" }}>

        <p style={{
          color: "#A99DBB",
          fontSize: "12px",
          fontWeight: "600",
          marginBottom: "11px"
        }}>
          SOUND PRESETS
        </p>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px"
        }}>

          {Object.keys(presets).map(preset => (

            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              style={{
                ...buttonStyle,
                background: frequencies.every(
                  (item, index) =>
                    item.value === presets[preset][index]
                )
                  ? "linear-gradient(135deg, #8957F5, #6338BB)"
                  : "#29203D",
                color: "white",
                borderColor: "#6946A4"
              }}
            >
              {preset}
            </button>

          ))}

        </div>
      </div>

      {/* FREQUENCY SLIDERS */}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: "10px"
      }}>

        {frequencies.map((item, index) => (

          <div
            key={item.hz}
            style={{
              textAlign: "center",
              background: "#211A32",
              border: "1px solid #35284F",
              borderRadius: "12px",
              padding: "14px 4px"
            }}
          >

            <p style={{
              color: "#B99AFF",
              fontSize: "12px",
              fontWeight: "700",
              margin: "0 0 12px"
            }}>
              {item.hz}
            </p>

            <div style={{
              height: "135px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>

              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={item.value}
                onChange={event =>
                  updateFrequency(index, event.target.value)
                }
                aria-label={`${item.label} frequency`}
                style={{
                  writingMode: "vertical-lr",
                  direction: "rtl",
                  height: "125px",
                  width: "25px",
                  accentColor: "#A78BFA",
                  cursor: "pointer"
                }}
              />

            </div>

            <div style={{
              color: item.value > 0 ? "#C4A5FF" :
                item.value < 0 ? "#F0A5C8" : "#FFFFFF",
              fontSize: "14px",
              fontWeight: "700",
              marginTop: "10px"
            }}>
              {item.value > 0 ? "+" : ""}
              {item.value} dB
            </div>

            <p style={{
              color: "#A49AB5",
              fontSize: "10px",
              margin: "6px 0 0"
            }}>
              {item.label}
            </p>

          </div>

        ))}

      </div>

      {/* FOOTER */}

      <div style={{
        background: "#211A32",
        border: "1px solid #35284F",
        borderRadius: "10px",
        padding: "13px",
        marginTop: "20px",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>

        <AudioWaveform size={20} color="#B99AFF" />

        <p style={{
          color: "#A99DBB",
          fontSize: "11px",
          margin: 0,
          lineHeight: "1.6"
        }}>
          Adjust each frequency between -12 dB and +12 dB
          to create your perfect sound profile.
        </p>

      </div>

    </div>
  );
}

export default Equalizer;
