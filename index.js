const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const fs = require('fs');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Load Excel data
const loadExcelData = () => {
    const workbook = xlsx.readFile(path.join(__dirname, 'prefix_data.xlsx'));
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
};

// Save Excel data
const saveExcelData = (data) => {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    xlsx.writeFile(workbook, path.join(__dirname, 'prefix_data.xlsx'));
};

let data = loadExcelData();

console.log("Data from Excel:", data);

// Function to find word matches based on suffix (end of the word)
const findPrefixMatches = (prefix) => {
    return data.filter(item => item.Word.toLowerCase().trim().endsWith(prefix.toLowerCase().trim()));
};

// Route to render the initial form
app.get('/', (req, res) => {
    res.render('index', { words: [], prefix: '' });
});

// Route to handle form submission and generate results
app.post('/generate', (req, res) => {
    const prefix = req.body.prefix.trim();
    const matches = findPrefixMatches(prefix);
    res.render('index', { words: matches, prefix: prefix });
});


// Route to handle adding a new example and meaning
app.post('/add-example', (req, res) => {
    const word = req.body.word.trim();
    const newExample = req.body.newExample.trim();
    const newMeaning = req.body.newMeaning.trim();

    // Find the word in the data
    let wordFound = false;
    data.forEach(item => {
        if (item.Word.toLowerCase() === word.toLowerCase()) {
            item.Example = newExample;
            item.Meaning = newMeaning;
            wordFound = true;
        }
    });

    // If the word was not found, add a new entry
    if (!wordFound) {
        data.push({ Word: word, Meaning: newMeaning, Example: newExample });
    }

    saveExcelData(data);
    res.redirect('/');
});

// Route to handle deleting an example
app.post('/delete-example', (req, res) => {
    const word = req.body.word.trim();

    data.forEach(item => {
        if (item.Word.toLowerCase() === word.toLowerCase()) {
            item.Example = '';
        }
    });

    saveExcelData(data);
    res.redirect('/');
});

// Route to handle editing an example
app.post('/edit-example', (req, res) => {
    const word = req.body.word.trim();
    const updatedExample = req.body.updatedExample.trim();
    const updatedMeaning = req.body.updatedMeaning.trim();

    data.forEach(item => {
        if (item.Word.toLowerCase() === word.toLowerCase()) {
            item.Example = updatedExample;
            item.Meaning = updatedMeaning;
        }
    });

    saveExcelData(data);
    res.redirect('/');
});

// Route to handle searching for words, meanings, or examples
app.post('/search', (req, res) => {
    const searchTerm = req.body.searchTerm.trim().toLowerCase();

    const searchResults = data.filter(item => {
        const word = item.Word.toLowerCase();
        const meaning = item.Meaning.toLowerCase();
        const example = item.Example.toLowerCase();

        return word.includes(searchTerm) || meaning.includes(searchTerm) || example.includes(searchTerm);
    });

    res.render('index', { words: searchResults, prefix: '' });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


