// Test script for Make.com webhook
fetch("https://hook.eu2.make.com/ajcskoiwdq5de96vc2z6fi5jxti1wsva", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: "test123",
    growth_area: "Confidence",
    user_reflection: "I struggled to speak up in a meeting today."
  })
})
.then(res => console.log("Status:", res.status))
.catch(err => console.error("Error:", err)); 