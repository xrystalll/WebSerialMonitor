const serialRequestBtn = document.querySelector(".serialRequest");
const statusCon = document.querySelector(".status");
const watch = document.querySelector(".watch");
const log = document.querySelector(".log");
const sendForm = document.querySelector(".sendForm");
const sendInput = document.querySelector(".sendInput");

let port;
let sync = true;

const cal = (part, timestamp = 0) => {
  let d;

  if (timestamp) {
    d = new Date(timestamp);
  } else {
    d = new Date();
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
  const minutes = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
  const seconds = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();

  switch (part) {
    case "Month":
      return months[d.getMonth()];
      break;
    case "Week":
      return week[d.getDay()];
      break;
    case "Date":
      return d.getDate();
      break;
    case "Hours":
      return hours;
      break;
    case "Minutes":
      return minutes;
      break;
    case "Seconds":
      return seconds;
      break;
    default:
      break;
  }
};

const addMessage = (text) => {
  const t = new Date();
  const div = document.createElement("div");
  const span = document.createElement("span");
  div.textContent = text;
  div.append(span);
  span.textContent =
    cal("Hours", t) + ":" + cal("Minutes", t) + ":" + cal("Seconds", t);
  log.prepend(div);
};

const connectSerial = async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    const decoder = new TextDecoderStream();

    port.readable.pipeTo(decoder.writable);

    const inputStream = decoder.readable;
    const reader = inputStream.getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (value) {
        addMessage(value);
      }
      if (done) {
        console.log("DONE", done);
        reader.releaseLock();
        break;
      }
    }
  } catch (error) {
    addMessage(error);
    if (error.toString().includes("The device has been lost")) {
      port = undefined;
      sync = true;
      statusCon.textContent = "";
    }
  }
};

const writeText = async (text) => {
  const encoder = new TextEncoder();
  const writer = port.writable.getWriter();

  await writer.write(encoder.encode(text));

  sendInput.value = "";
  writer.releaseLock();
};

serialRequestBtn.addEventListener("click", () => {
  if ("serial" in navigator) {
    connectSerial();
  } else {
    addMessage("Web Serial API not supported.");
  }
});

sendForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!port) {
    addMessage("Not connected");
    return;
  }

  const text = sendInput.value;

  if (text.length > 0) {
    writeText(text);
    sendInput.classList.remove("err");
  } else {
    sendInput.classList.add("err");
  }
});

const loop = setInterval(() => {
  watch.textContent =
    cal("Hours") + ":" + cal("Minutes") + ":" + cal("Seconds");

  if (port) {
    if (sync) {
      addMessage("Wait connection...");
      sync = false;
      statusCon.textContent = "Connected";
    }
  }
}, 1000);
