import { supabase } from "./supabaseClient.js";

const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#admin-email");
const passwordInput = document.querySelector("#admin-password");
const adminPanel = document.querySelector("#admin-panel");
const adminMessage = document.querySelector("#admin-message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        adminMessage.textContent = error.message;
        return;
    }

    adminMessage.textContent = "Logged in.";
    loginForm.hidden = true;
    adminPanel.hidden = false;

});

function parseWordBatch(text){
    const normalized = text.toLowerCase();
    const raw = normalized.split(/[\s,]+/);

    const words = raw.filter(word => word!== "");

    const valid = [];
    const rejected = [];

    for (const word of words){
        if (/^[a-z]{5}$/.test(word)){
            valid.push(word);
        } else {
            rejected.push(word);
        }
    }

    const unique = [...new Set(valid)];

    return {
        valid: unique,
        rejected
    };
}

const wordForm = document.querySelector("#word-form");
const wordBatchInput = document.querySelector("#word-batch-input");

wordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = wordBatchInput.value;
    const result = parseWordBatch(text);

    if (result.valid.length === 0) {
        adminMessage.textContent = "No valid 5-letter words found.";
        return;
    }

    const rowsToInsert = result.valid.map(word => ({ word }));

    const { data, error } = await supabase
        .from("words")
        .upsert(rowsToInsert, {
            onConflict: "word",
            ignoreDuplicates: true
        }).select();

    if (error) {
        console.error(error);
        adminMessage.textContent = error.message;
        return;
    }
    
    adminMessage.textContent = `Found ${result.valid.length} valid words and ${result.rejected.length} rejected words.`;

    wordBatchInput.value = "";
});