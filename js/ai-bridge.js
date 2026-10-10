/* ==========================================================================
   AI Bridge — اتصال فرانت‌اند گالری به Cloudflare Workers AI
   آدرس ورکر فعال: https://futuremakers-api.ghrezaei1399.workers.dev
   ========================================================================== */

(function () {
    'use strict';

    // آدرس ورکر فعال شما در کلودفلر
    const WORKER_URL = "https://futuremakers-api.ghrezaei1399.workers.dev";

    // نگهداری سابقه پیام‌ها برای پیوستگی در گفت‌وگو
    const chatHistory = [
        {
            role: "system",
            content: "تو «هوشیار»، دستیار هوشمند و محرم خانواده خاندان رضائی هستی. با احترام، صمیمیت، دقت، و به زبان فارسی پاسخ بده."
        }
    ];

    document.addEventListener('DOMContentLoaded', () => {
        const sendBtn = document.getElementById('aiSend');
        const inputField = document.getElementById('aiInput');
        const chatLog = document.getElementById('aiLog');

        if (!sendBtn || !inputField || !chatLog) return;

        async function sendMessage() {
            const userText = inputField.value.trim();
            if (!userText) return;

            // ۱. ثبت پیام کاربر در صفحه
            const userRow = document.createElement('p');
            userRow.className = 'user-msg';
            userRow.textContent = 'شما: ' + userText;
            chatLog.appendChild(userRow);

            inputField.value = '';
            chatLog.scrollTop = chatLog.scrollHeight;

            // ۲. ثبت پیام موقت «در حال پاسخ‌نویسی»
            const aiRow = document.createElement('p');
            aiRow.className = 'ai-msg';
            aiRow.textContent = 'هوشیار: در حال اندیشیدن و پاسخ‌نویسی...';
            chatLog.appendChild(aiRow);
            chatLog.scrollTop = chatLog.scrollHeight;

            // غیرفعال کردن موقت دکمه ارسال
            sendBtn.disabled = true;

            // افزودن پیام کاربر به تاریخچه
            chatHistory.push({ role: "user", content: userText });

            try {
                // ۳. ارسال درخواست به کلودفلر ورکر
                const response = await fetch(`${WORKER_URL}/api/ai/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: chatHistory
                    })
                });

                if (!response.ok) {
                    throw new Error(`خطای سرور: ${response.status}`);
                }

                const data = await response.json();
                const aiReply = data.reply || data.response || "پاسخی از مدل دریافت نشد.";

                // ۴. به‌روزرسانی متن پاسخ و ثبت در تاریخچه
                aiRow.textContent = 'هوشیار: ' + aiReply;
                chatHistory.push({ role: "assistant", content: aiReply });

            } catch (err) {
                console.error("AI Bridge Error:", err);
                aiRow.textContent = 'هوشیار: متأسفانه در برقراری ارتباط با هسته هوش مصنوعی خطایی رخ داد. لطفاً اتصال اینترنت خود را بررسی کنید.';
            } finally {
                sendBtn.disabled = false;
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        }

        // رویداد کلیک روی دکمه ارسال
        sendBtn.addEventListener('click', sendMessage);

        // رویداد زدن دکمه اینتر
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    });
})();
