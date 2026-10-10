/* ==========================================================================
   AI Bridge — اتصال فرانت‌اند گالری به Cloudflare Workers AI (هوشیار)
   ورکر فعال: family-gallery-api
   ========================================================================== */

(function () {
    'use strict';

    // آدرس ورکر فعال خاندان رضائی
    const WORKER_URL = "https://family-gallery-api.ghrezaei1399.workers.dev";

    document.addEventListener('DOMContentLoaded', () => {
        const sendBtn = document.getElementById('aiSend');
        const inputField = document.getElementById('aiInput');
        const chatLog = document.getElementById('aiLog');

        if (!sendBtn || !inputField || !chatLog) return;

        function appendMessage(sender, text, isAi = false) {
            const msgDiv = document.createElement('div');
            msgDiv.className = isAi ? 'ai-msg-bubble ai-reply' : 'ai-msg-bubble user-query';
            msgDiv.style.margin = '8px 0';
            msgDiv.style.padding = '10px 14px';
            msgDiv.style.borderRadius = '12px';
            msgDiv.style.lineHeight = '1.7';
            msgDiv.style.fontSize = '0.95rem';

            if (isAi) {
                msgDiv.style.background = 'rgba(212, 175, 55, 0.12)';
                msgDiv.style.borderRight = '4px solid #d4af37';
                msgDiv.style.color = '#fff';
                msgDiv.innerHTML = `<strong>هوشیار:</strong> ${escapeHtml(text)}`;
            } else {
                msgDiv.style.background = 'rgba(255, 255, 255, 0.08)';
                msgDiv.style.borderLeft = '4px solid #64b5f6';
                msgDiv.style.color = '#eee';
                msgDiv.innerHTML = `<strong>شما:</strong> ${escapeHtml(text)}`;
            }

            chatLog.appendChild(msgDiv);
            chatLog.scrollTop = chatLog.scrollHeight;
            return msgDiv;
        }

        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        async function handleSend() {
            const question = inputField.value.trim();
            if (!question) return;

            appendMessage('شما', question, false);
            inputField.value = '';
            inputField.disabled = true;
            sendBtn.disabled = true;

            const loadingBubble = appendMessage('هوشیار', 'در حال اندیشیدن و پاسخ‌گویی...', true);

            try {
                const response = await fetch(`${WORKER_URL}/api/ai/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: question
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const aiText = data.reply || data.response || data.message || "پاسخی دریافت نشد.";
                    loadingBubble.innerHTML = `<strong>هوشیار:</strong> ${escapeHtml(aiText)}`;
                } else {
                    const errMsg = data.error || 'خطایی رخ داده است.';
                    loadingBubble.innerHTML = `<strong>هوشیار:</strong> <span style="color:#ff8a80;">${escapeHtml(errMsg)}</span>`;
                }
            } catch (err) {
                loadingBubble.innerHTML = `<strong>هوشیار:</strong> <span style="color:#ff8a80;">خطا در برقراری ارتباط با خادم. لطفاً اتصال اینترنت را بررسی کنید.</span>`;
            } finally {
                inputField.disabled = false;
                sendBtn.disabled = false;
                inputField.focus();
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        }

        sendBtn.addEventListener('click', handleSend);
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    });
})();
