class CitationManager {
    constructor() {
        this.citationsKey = 'savedCitations';
    }

    // Get all saved citations
    getCitations() {
        const citations = localStorage.getItem(this.citationsKey);
        return citations ? JSON.parse(citations) : [];
    }

    // Save a new citation
    saveCitation(citation) {
        const citations = this.getCitations();
        
        // Check if citation already exists
        const exists = citations.some(c => c.text === citation);
        if (exists) return false;

        citations.push({ 
            text: citation, 
            timestamp: Date.now() 
        });

        // Sort citations alphabetically by paper name
        citations.sort((a, b) => {
            const nameA = this.extractPaperName(a.text);
            const nameB = this.extractPaperName(b.text);
            return nameA.localeCompare(nameB);
        });

        localStorage.setItem(this.citationsKey, JSON.stringify(citations));
        return true;
    }

    // Remove a citation
    removeCitation(citationText) {
        let citations = this.getCitations();
        citations = citations.filter(c => c.text !== citationText);
        localStorage.setItem(this.citationsKey, JSON.stringify(citations));
    }

    // Extract paper name for sorting
    extractPaperName(citation) {
        // Assumes citation format: "Author (Year) 'Paper Title', 'Journal'"
        const match = citation.match(/'([^']*?)'/);
        return match ? match[1] : citation;
    }

    // Render saved citations
    renderSavedCitations() {
        const citationsList = document.getElementById('pastCitationsList');
        citationsList.innerHTML = ''; // Clear existing list

        const citations = this.getCitations();
        citations.forEach(citation => {
            const citationItem = document.createElement('div');
            citationItem.classList.add('past-citation-item');
            
            const citationText = document.createElement('div');
            citationText.classList.add('past-citation-text');
            citationText.innerHTML = citation.text;

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-citation-btn');
            deleteButton.textContent = '✕';
            deleteButton.addEventListener('click', () => {
                this.removeCitation(citation.text);
                this.renderSavedCitations();
            });

            citationItem.appendChild(citationText);
            citationItem.appendChild(deleteButton);
            citationsList.appendChild(citationItem);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const citationManager = new CitationManager();

    // Initial render of saved citations
    citationManager.renderSavedCitations();

    // Function to copy citation to clipboard
    document.getElementById('copyButton').addEventListener('click', async () => {
        const output = document.getElementById('output').innerHTML; // Get the HTML content
    
        // Create a new clipboard item with HTML content
        const clipboardItem = new ClipboardItem({
            "text/html": new Blob([output], { type: "text/html" }),
            "text/plain": new Blob([document.getElementById('output').innerText], { type: "text/plain" })
        });
    
        try {
            // Write the clipboard item to the clipboard
            await navigator.clipboard.write([clipboardItem]);
    
            // Show tooltip on successful copy
            const tooltip = document.querySelector('.tooltip');
            tooltip.classList.add('visible');
            setTimeout(() => {
                tooltip.classList.remove('visible');
            }, 2000);
        } catch (error) {
            console.error('Failed to copy content:', error);
        }
    });

    // Function to handle citation generation
    document.getElementById("processLink").addEventListener("click", async () => {
        const title = document.getElementById("articleInput").value;
        
        try {
            const result = await searchCrossrefByTitle(title);

            if (typeof result === "string") {
                console.log(result);
                document.getElementById("output").innerText = result;
            } else {
                const formattedAuthor = formatAuthor(result.author_last, result.author_first);
                const output = `${formattedAuthor} (${result.published_date}) '${result.title}', '<i>${result.journal}</i>'. doi:${result.doi}`;
                document.getElementById("output").innerHTML = output;

                // Add save button functionality
                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save Citation';
                saveButton.classList.add('save-citation-btn');
                saveButton.addEventListener('click', () => {
                    const saved = citationManager.saveCitation(output);
                    if (saved) {
                        citationManager.renderSavedCitations();
                        alert('Citation saved successfully!');
                    } else {
                        alert('This citation is already saved.');
                    }
                });

                // Append save button next to output
                const outputContainer = document.querySelector('.output-container');
                const existingSaveButton = outputContainer.querySelector('.save-citation-btn');
                    if (existingSaveButton) {
                        outputContainer.removeChild(existingSaveButton);
                    }
                outputContainer.appendChild(saveButton);
            }
        } catch (error) {
            console.error("Error generating citation:", error);
            document.getElementById("output").innerText = "Error generating citation. Please try again.";
        }
    });
});
    