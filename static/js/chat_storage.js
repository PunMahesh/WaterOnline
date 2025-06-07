function getAnonymousUserId() {
    let userId = localStorage.getItem("anon_user_id");
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem("anon_user_id", userId);
    }
    return userId;
}

function appendMessage(role, text) {
  const container = document.getElementById("chat-history");
  const msg = document.createElement("div");
  msg.className = `chat-message ${role}`;
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight; 
}

function askAI() {
  const prompt = document.getElementById("question").value.trim();
  if (!prompt) return;

  const userId = getAnonymousUserId();
  appendMessage("user", prompt); // Show user's message
  document.getElementById("question").value = "";

  fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, user_id: userId })
  })
  .then(r => r.json())
  .then(data => {
    appendMessage("bot", data.response || data.error);
  });
}



// WaterBot Colse Open
function toggleWaterBot() {
  const div = document.getElementById("waterbot");
  if (div.style.display === "none" || div.style.display === "") {
    div.style.display = "block";
    document.addEventListener("click", handleClickOutside);
  } else {
    div.style.display = "none";
    document.removeEventListener("click", handleClickOutside);
  }
}

function handleClickOutside(event) {
  const bot = document.getElementById("waterbot");
  const trigger = document.getElementById("ai-assistant");

  if (!bot.contains(event.target) && !trigger.contains(event.target)) {
    bot.style.display = "none";
    document.removeEventListener("click", handleClickOutside);
  }
}