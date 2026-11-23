
import { useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Upload, AudioWaveform, LoaderCircle } from "lucide-react";

function AudioExtractor({ video, onAudioExtracted }) {
  

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const ffmpegRef = useRef(null);

  
 
    



async function loadFFmpeg() {

  if (ffmpegRef.current) {
    return ffmpegRef.current;
  }

  const ffmpeg = new FFmpeg();

  ffmpeg.on("log", ({ message }) => {
    console.log("FFmpeg:", message);
  });

  ffmpeg.on("progress", ({ progress }) => {
    setProgress(Math.round(progress * 100));
  });

  setMessage("Loading FFmpeg engine...");

  try {

    const baseURL = "/ffmpeg";

    const coreURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript"
    );

    const wasmURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm"
    );

    await ffmpeg.load({
      coreURL: coreURL,
      wasmURL: wasmURL
    });

    ffmpegRef.current = ffmpeg;

    console.log("FFmpeg engine loaded successfully!");

    setMessage("Audio engine ready!");

    return ffmpeg;

  } catch (error) {

    console.error("FFmpeg loading failed:", error);

    throw error;

  }
}







  async function extractAudio() {

    console.log("STEP 0: Extract button clicked");

    if (!video) {
      setMessage("Please upload a video first.");
      return;
    }

    try {

      setLoading(true);
      setProgress(0);

      const ffmpeg = await loadFFmpeg();

      setMessage("Audio engine ready. Reading video...");

      setMessage("Reading video...");

      await ffmpeg.writeFile(
        "input.mp4",
        await fetchFile(video.url)
      );

      setMessage("Extracting audio...");

      await ffmpeg.exec([
        "-i", "input.mp4",
        "-vn",
        "-codec:a", "libmp3lame",
        "-q:a", "2",
        "output.mp3"
      ]);

      const data = await ffmpeg.readFile("output.mp3");

      const audioBlob = new Blob(
        [data],
        { type: "audio/mpeg" }
      );

      const audioUrl = URL.createObjectURL(audioBlob);

      onAudioExtracted({
        name: video.name.replace(/\.[^/.]+$/, "") + ".mp3",
        url: audioUrl
      });

      setMessage("Audio extracted successfully!");

    } catch (error) {

        console.error("FFmpeg extraction error:", error);

        setMessage(
            "Extraction failed: " + (error.message || "Unknown error")
        );

        } finally {

      setLoading(false);

    }
  }

  return (

    <div style={{
      background: "#211C32",
      border: "1px solid #49356D",
      padding: "22px",
      borderRadius: "12px",
      marginTop: "20px"
    }}>

      <h3 style={{
        marginBottom: "10px",
        color: "#F5F3FF"
      }}>
        Extract Audio from Video
      </h3>

      <p style={{
        color: "#9994AA",
        fontSize: "13px",
        marginBottom: "18px"
      }}>
        Convert your uploaded video into an MP3 audio file.
      </p>

      <button
        type="button"
        onClick={extractAudio}
        disabled={loading || !video}
        style={{
          background: "#8957F5",
          color: "white",
          border: "none",
          padding: "13px 20px",
          borderRadius: "9px",
          cursor: loading || !video ? "not-allowed" : "pointer",
          opacity: loading || !video ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >

        {loading
          ? <LoaderCircle size={18} />
          : <AudioWaveform size={18} />
        }

        {loading ? "Extracting..." : "Extract Audio"}

      </button>

      {loading && (

        <div style={{
          background: "#373047",
          height: "7px",
          borderRadius: "10px",
          marginTop: "20px",
          overflow: "hidden"
        }}>

          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: "#A78BFA",
            transition: "width 0.2s"
          }} />

        </div>

      )}

      {message && (

        <p style={{
          color: "#B99AFF",
          fontSize: "13px",
          marginTop: "15px"
        }}>
          {message}
        </p>

      )}

    </div>

  );

}

export default AudioExtractor;
