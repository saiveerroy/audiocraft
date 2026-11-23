
import { useState, useRef } from "react";
import AudioExtractor from "./components/AudioExtractor";
import AudioEditor from "./components/AudioEditor";
import Equalizer from "./components/Equalizer";
import {
  AudioWaveform,
  LayoutDashboard,
  Folder,
  Music,
  Settings,
  UploadCloud,
  Play,
  Pause,
  Scissors,
  Download,
  Video,
  Plus,
  Search,
  Bell,
  Volume2,
  Sparkles,
  FileAudio,
  Trash2,
  Headphones,
  X,
  Menu,
  Clock,
  HardDrive,
  Waves
} from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [video, setVideo] = useState(null);
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState(
    "Welcome to AudioCraft Studio!"
  );

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const videoInput = useRef(null);
  const audioInput = useRef(null);

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Projects", icon: Folder },
    { name: "Audio Library", icon: Music },
    { name: "Settings", icon: Settings }
  ];

  // VIDEO UPLOAD

  function handleVideoUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setMessage("Please select a valid video file.");
      return;
    }

    if (video) URL.revokeObjectURL(video.url);

    const url = URL.createObjectURL(file);

    setVideo({
      name: file.name,
      url,
      size: (file.size / (1024 * 1024)).toFixed(2)
    });

    setMessage("Video uploaded successfully!");
    event.target.value = "";
  }

  // AUDIO UPLOAD

  function handleAudioUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setMessage("Please select a valid audio file.");
      return;
    }

    if (audio) URL.revokeObjectURL(audio.url);

    const url = URL.createObjectURL(file);

    setAudio({
      name: file.name,
      url
    });

    setIsPlaying(false);
    setMessage("Audio uploaded successfully!");
    event.target.value = "";
  }

  // AUDIO PLAYBACK

  function toggleAudio() {
    if (!audioRef.current || !audio) {
      setMessage("Please upload an audio file first.");
      return;
    }

    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {
        setMessage("Unable to play this audio file.");
      });
    } else {
      audioRef.current.pause();
    }
  }

  // REMOVE VIDEO

  function removeVideo() {
    if (video) URL.revokeObjectURL(video.url);

    setVideo(null);
    setMessage("Video removed successfully.");
  }

  // REMOVE AUDIO

  function removeAudio() {
    if (audioRef.current) audioRef.current.pause();

    if (audio) URL.revokeObjectURL(audio.url);

    setAudio(null);
    setIsPlaying(false);
    setMessage("Audio removed successfully.");
  }

  // DOWNLOAD AUDIO

  function downloadAudio() {
    if (!audio) {
      setMessage("Please upload or extract audio first.");
      return;
    }

    const link = document.createElement("a");
    link.href = audio.url;
    link.download = audio.name;
    link.click();

    setMessage("Audio download started!");
  }
  
  const styles = {
    app: {
      display: "flex",
      minHeight: "100vh",
      background: "#0B0913",
      color: "#F5F3FF",
      fontFamily: "Inter, Arial, sans-serif"
    },

    sidebar: {
      width: "245px",
      minHeight: "100vh",
      background: "#141020",
      borderRight: "1px solid #29213B",
      padding: "28px 18px",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0
    },

    logo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      fontSize: "21px",
      fontWeight: "bold",
      marginBottom: "45px"
    },

    logoIcon: {
      background: "linear-gradient(135deg,#A879FF,#7139DD)",
      padding: "11px",
      borderRadius: "12px"
    },

    navItem: {
      display: "flex",
      alignItems: "center",
      gap: "13px",
      padding: "13px",
      borderRadius: "10px",
      cursor: "pointer",
      marginBottom: "7px",
      fontSize: "14px",
      transition: "0.2s"
    },

    main: {
      flex: 1,
      minWidth: 0,
      padding: "28px 35px"
    },

    card: {
      background: "#171323",
      border: "1px solid #302543",
      borderRadius: "16px",
      padding: "23px",
      marginBottom: "22px"
    },

    button: {
      background: "linear-gradient(135deg,#A879FF,#7541DC)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "12px 19px",
      fontWeight: "bold",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "9px"
    },

    secondaryButton: {
      background: "#302344",
      color: "#C9AEFF",
      border: "1px solid #574174",
      borderRadius: "9px",
      padding: "10px",
      cursor: "pointer"
    },

    smallText: {
      color: "#A29AAF",
      fontSize: "13px"
    },

    uploadBox: {
      border: "2px dashed #644994",
      borderRadius: "14px",
      padding: "38px 15px",
      textAlign: "center",
      cursor: "pointer",
      background: "#211831"
    },

    waveform: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "3px",
      height: "100px",
      background: "#211831",
      borderRadius: "10px",
      padding: "10px",
      overflow: "hidden"
    }
  };

  return (
    <div style={styles.app}>

      {/* SIDEBAR */}

      {sidebarOpen && (
        <aside style={styles.sidebar}>

          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <AudioWaveform size={25} color="white" />
            </div>
            <span>AudioCraft</span>
          </div>

          <p style={{
            ...styles.smallText,
            fontSize: "11px",
            letterSpacing: "1.5px",
            fontWeight: "bold",
            marginBottom: "16px"
          }}>
            WORKSPACE
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                style={{
                  ...styles.navItem,
                  background: activeTab === item.name
                    ? "#38264F"
                    : "transparent",
                  color: activeTab === item.name
                    ? "#C9AEFF"
                    : "#A29AAF"
                }}
              >
                <Icon size={19} />
                {item.name}
              </div>
            );
          })}

          <div style={{ flex: 1 }} />

          <div style={{
            background: "linear-gradient(145deg,#302044,#20172E)",
            border: "1px solid #49335F",
            borderRadius: "14px",
            padding: "17px"
          }}>
            <Sparkles color="#C9AEFF" size={23} />

            <h4 style={{ margin: "12px 0 8px" }}>
              Creative Studio
            </h4>

            <p style={styles.smallText}>
              Create beautiful audio experiences.
            </p>
          </div>

        </aside>
      )}

      {/* MAIN CONTENT */}

      <main style={styles.main}>

        {/* TOP NAVBAR */}

        <div style={{
          ...styles.card,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px"
        }}>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "13px"
          }}>
            <button
              style={styles.secondaryButton}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={19} />
            </button>

            <strong style={{ fontSize: "20px" }}>
              AudioCraft Studio
            </strong>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}>
            <Search color="#A29AAF" size={20} />
            <Bell color="#A29AAF" size={20} />

            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#A879FF,#6334B5)",
              display: "grid",
              placeItems: "center",
              fontWeight: "bold"
            }}>
              U
            </div>
          </div>

        </div>

        {/* WELCOME SECTION */}

        <div style={{ margin: "30px 0" }}>

          <p style={{
            color: "#B99AFF",
            fontSize: "13px",
            marginBottom: "10px"
          }}>
            WELCOME TO YOUR CREATIVE SPACE
          </p>

          <h1 style={{
            fontSize: "32px",
            marginBottom: "10px"
          }}>
            Your Creative Studio 🎧
          </h1>

          <p style={styles.smallText}>
            Extract, edit and create beautiful audio from your videos.
          </p>

        </div>

        {/* STATISTICS */}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: "16px",
          marginBottom: "25px"
        }}>

          {[
            {
              title: "Video Projects",
              value: video ? "1" : "0",
              icon: Video
            },
            {
              title: "Audio Files",
              value: audio ? "1" : "0",
              icon: FileAudio
            },
            {
              title: "Storage Used",
              value: video ? video.size + " MB" : "0 MB",
              icon: HardDrive
            }
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} style={styles.card}>
                <Icon color="#B99AFF" size={23} />

                <p style={{
                  ...styles.smallText,
                  marginTop: "15px"
                }}>
                  {item.title}
                </p>

                <h2 style={{
                  marginTop: "7px",
                  fontSize: "25px"
                }}>
                  {item.value}
                </h2>
              </div>
            );
          })}

        </div>

        {/* VIDEO UPLOAD */}

        <section style={styles.card}>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <div>
              <h3>Start a New Project</h3>

              <p style={{
                ...styles.smallText,
                marginTop: "7px"
              }}>
                Upload your video and extract its audio.
              </p>
            </div>

            <Video color="#B99AFF" size={28} />
          </div>

          <div
            style={styles.uploadBox}
            onClick={() => videoInput.current?.click()}
          >
            <input
              type="file"
              accept="video/*"
              ref={videoInput}
              onChange={handleVideoUpload}
              style={{ display: "none" }}
            />

            <UploadCloud size={45} color="#B99AFF" />

            <h3 style={{ margin: "15px 0 8px" }}>
              Drop your video here
            </h3>

            <p style={styles.smallText}>
              Or click to browse files from your device.
            </p>

            <button
              type="button"
              style={{
                ...styles.button,
                marginTop: "18px"
              }}
            >
              <Plus size={17} />
              Upload Video
            </button>

            <p style={{
              ...styles.smallText,
              marginTop: "15px",
              fontSize: "11px"
            }}>
              Supported formats: MP4, MOV, AVI, WEBM
            </p>
          </div>

          {video && (
            <div style={{
              marginTop: "20px",
              background: "#211831",
              borderRadius: "12px",
              padding: "15px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center"
                }}>
                  <Video color="#B99AFF" />

                  <div>
                    <strong>{video.name}</strong>
                    <p style={styles.smallText}>
                      {video.size} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeVideo}
                  style={styles.secondaryButton}
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <video
                ref={videoRef}
                src={video.url}
                controls
                style={{
                  width: "100%",
                  maxHeight: "260px",
                  marginTop: "15px",
                  borderRadius: "10px"
                }}
              />
            </div>
          )}

        </section>
        
        {/* AUDIO EXTRACTION */}

        <AudioExtractor
          video={video}
          onAudioExtracted={(extractedAudio) => {
            if (audio) URL.revokeObjectURL(audio.url);

            setAudio(extractedAudio);
            setIsPlaying(false);
            setMessage("Video audio extracted successfully!");
          }}
        />

        {/* EXISTING AUDIO EDITOR */}

        <AudioEditor audio={audio} />

        

        {/* AUDIO PLAYER */}

        <section style={styles.card}>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h3>Audio Workspace</h3>

              <p style={{
                ...styles.smallText,
                marginTop: "7px"
              }}>
                Preview and manage your audio files.
              </p>
            </div>

            <AudioWaveform color="#B99AFF" size={28} />
          </div>

          <div style={{
            background: "#211831",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "20px"
          }}>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px"
            }}>

              <div style={{
                display: "flex",
                gap: "12px",
                alignItems: "center"
              }}>
                <FileAudio color="#B99AFF" />

                <div>
                  <strong>
                    {audio ? audio.name : "No audio selected"}
                  </strong>

                  <p style={styles.smallText}>
                    {audio
                      ? "Ready to preview"
                      : "Upload or extract audio to begin"}
                  </p>
                </div>
              </div>

              <div style={{
                display: "flex",
                gap: "8px"
              }}>
                <button
                  type="button"
                  onClick={() => audioInput.current?.click()}
                  style={styles.secondaryButton}
                >
                  <Plus size={18} />
                </button>

                {audio && (
                  <button
                    type="button"
                    onClick={removeAudio}
                    style={styles.secondaryButton}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <input
                type="file"
                accept="audio/*"
                ref={audioInput}
                onChange={handleAudioUpload}
                style={{ display: "none" }}
              />

            </div>

            {/* WAVEFORM PREVIEW */}

            <div style={styles.waveform}>
              {Array.from({ length: 75 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: "2px",
                    height: `${
                      15 + Math.abs(Math.sin(i * 0.7) * 65)
                    }px`,
                    background: i < 35
                      ? "#A879FF"
                      : "#514078",
                    borderRadius: "5px"
                  }}
                />
              ))}
            </div>

            {/* PLAYER CONTROLS */}

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "20px"
            }}>

              <button
                type="button"
                onClick={toggleAudio}
                style={{
                  ...styles.button,
                  borderRadius: "50%",
                  width: "48px",
                  height: "48px",
                  padding: "0"
                }}
              >
                {isPlaying
                  ? <Pause size={20} />
                  : <Play size={20} />
                }
              </button>

              <div style={{
                display: "flex",
                gap: "9px"
              }}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                >
                  <Scissors size={18} />
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
                >
                  <Volume2 size={18} />
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
                >
                  <Headphones size={18} />
                </button>
              </div>

              <button
                type="button"
                style={styles.button}
                onClick={downloadAudio}
              >
                <Download size={17} />
                Download Audio
              </button>

            </div>

            <audio
              ref={audioRef}
              src={audio?.url || undefined}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />

          </div>

          {/* TRIMMING */}

          <div style={{
            display: "flex",
            gap: "25px",
            flexWrap: "wrap",
            marginTop: "22px"
          }}>

            <div style={{
              flex: 1,
              minWidth: "180px"
            }}>
              <label style={styles.smallText}>
                Start Point: {startTime}%
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={startTime}
                onChange={(e) => setStartTime(
                  Math.min(Number(e.target.value), endTime)
                )}
                style={{
                  width: "100%",
                  accentColor: "#A879FF",
                  marginTop: "12px"
                }}
              />
            </div>

            <div style={{
              flex: 1,
              minWidth: "180px"
            }}>
              <label style={styles.smallText}>
                End Point: {endTime}%
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={endTime}
                onChange={(e) => setEndTime(
                  Math.max(Number(e.target.value), startTime)
                )}
                style={{
                  width: "100%",
                  accentColor: "#A879FF",
                  marginTop: "12px"
                }}
              />
            </div>

          </div>

        </section>

        {/* STATUS MESSAGE */}

        <div style={{
          background: "#211831",
          border: "1px solid #49356D",
          padding: "16px",
          borderRadius: "12px",
          color: "#C9AEFF",
          fontSize: "13px",
          marginTop: "20px"
        }}>
          <Sparkles
            size={17}
            style={{
              verticalAlign: "middle",
              marginRight: "9px"
            }}
          />
          {message}
        </div>

        {/* FOOTER */}

        <p style={{
          textAlign: "center",
          color: "#817990",
          fontSize: "12px",
          marginTop: "30px",
          paddingBottom: "20px"
        }}>
          AudioCraft Studio © 2026 | Create Your Sound.
        </p>

      </main>
    </div>
  );
}

export default App;


