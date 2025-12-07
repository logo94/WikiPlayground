// CDN
import { WapiClient } from 'https://cdn.jsdelivr.net/gh/logo94/wapi-client@main/WapiClient.js';

// Locale
import { startingQuery, formatQuery, claimBodyNoMatchValue, claimBodyValue  } from "./js/sparql.js"
import { wikiRowBody, createLiElement } from './js/wikiListBody.js';

// Inizializzazione pagina
document.addEventListener("DOMContentLoaded", async () => {

    const login_status = document.getElementById('login_status');
    const login_button = document.getElementById('wiki_login');
    const errorBox = document.getElementById('errorBox');
    const sparql_textarea = document.getElementById('query_sparql');
    const sparql_btn = document.getElementById('start_sparql');
    const wikiList = document.getElementById('wiki_list');

    const mainModal = new bootstrap.Modal(document.getElementById('detailModal'));

    const wikiListElement = document.getElementById('wiki-box')
    const viafListElement = document.getElementById('viaf-box')
    const viafCounter = document.getElementById('viaf-counter')
    const opacListElement = document.getElementById('opac-box')
    const opacDetailElement = document.getElementById('opac-detail')

    const backBtn = document.getElementById('back_btn');
    const noticeBtn = document.getElementById('notice_btn');
    const noValueBtn = document.getElementById('novalue_btn');
    const editBtn = document.getElementById('edit_btn');
    

    let query
    let wiki
    let wikid
    let viaf_titles = []

    // WapiClient
    const client = new WapiClient('https://www.wikidata.org', 'it', true);

    let checkLogin = await client.getUserInfo();
    let token = await client.getCsrfToken();

    if (!checkLogin || !token) {
        errorBox.style.display = 'block';
        sparql_btn.innerText = "Login richiesto";
        return false;
    } else {
        errorBox.style.display = 'none';
        login_button.style.display = 'none';
        login_status.className = "alert alert-success text-success m-0 px-2 pt-1"
        login_status.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-circle mb-1" viewBox="0 0 16 16">
        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
        <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
        </svg>
        ${checkLogin.name}`
    }   

    let editor = CodeMirror.fromTextArea(sparql_textarea, {
        mode: 'application/sparql-query', // Modalità SPARQL
        lineNumbers: true, // Mostra numeri di linea
        theme: 'default', // Tema dell'editor
        matchBrackets: true, // Evidenzia parentesi corrispondenti
        viewportMargin: Infinity
    });

    query = await startingQuery()

    editor.setValue(query);
    editor.setSize(null, 650);
    editor.getDoc().markText(
        { line: 0, ch: 0 }, // Inizio del documento
        { line: 1, ch: 0 }, // Fine della sezione (posizione di "WHERE")
        { readOnly: true, css: "color: #999;" } // Opzioni
    );
    
    // Esecuzione query sparql e creazione lista elementi wikidata
    sparql_btn.addEventListener('click', async (event) => {
        event.preventDefault();

        sparql_btn.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"></div>`

        wikiList.innerHTML = ""

        query = editor.getValue();

        const query_params = query.split("WHERE {")[1].split("}\nLIMIT ")[0].trim()
        const query_limit = query.split("LIMIT ")[1].trim()

        const updatedQuery = await formatQuery(query_params, query_limit)

        const entities = await client.querySparql(updatedQuery);
        
        if (entities.length === 0) {
            alert("Nessun risultato trovato, query non valida")
            return false

        } else {

            wikiList.hidden = false
        
            new bootstrap.Collapse(document.getElementById('sparql_row'), { hide: true });
            new bootstrap.Collapse(document.getElementById('results_row'), { show: true });

            sparql_btn.innerHTML = "Cerca"
        }

        for (const entity of entities) {

            const wiki_id = entity.item.value.split("/").pop();

            const opac_params = new URLSearchParams({
                core: "autori",
                "item:6003:Nome": entity.itemLabel.value,
                "filter_nocheck:6021:Tipo_nome": "Persona:A"
            });

            const opac_req = await client.wapiFetch(`https://opac.sbn.it/o/opac-api/titles-search-auth?${opac_params.toString()}`, 'GET', {'Accept': 'application/json'}, null);
            const opac_data = await opac_req.json();
            const opac_results = opac_data.data.results.map((entity) => ({
                vid: entity[0].id.replace("ITICCU", ""),
                label: entity[0].label.replace(" , ", ", "),
                type: entity[3].contents[0].value
            }));

            const entityElement = document.createElement("li")
            entityElement.className = "list-group-item border-0"
            entityElement.innerHTML = await wikiRowBody(entity, wiki_id, opac_results.length)            
            wikiList.appendChild(entityElement)

        };

    });

    // Modal dettaglio
    document.addEventListener('click', async (event) => {

        if (event.target.classList.contains('detail_btn')) {

            wikiListElement.innerHTML = ""
            viafListElement.innerHTML = ""
            opacListElement.innerHTML = ""
            opacDetailElement.innerHTML = ""

            opacDetailElement.hidden = true
            opacListElement.hidden = false

            backBtn.hidden = true
            editBtn.hidden = true


            mainModal.show()

            try {
                wikid = event.target.innerText
                wiki = await client.getItem(wikid)
                let details = await client.getItemDetails(wikid)

                // Immagine elemento
                const imgElement = document.createElement("li")
                imgElement.className = "list-group-item border-0 mb-2"
                imgElement.innerHTML = `
                    <div class="row w-100 justify-content-center">
                        <div class="col-auto">
                            ${event.target.closest('.card').querySelector('img').outerHTML}
                        </div>
                    </div>
                    `
                wikiListElement.appendChild(imgElement)

                // ID Elemento
                const idElement = createLiElement("ID:", `<a href="https://www.wikidata.org/wiki/${wikid}" target="_blank">${wikid}</a>`)
                wikiListElement.appendChild(idElement)

                // Titolo
                const titleElement = createLiElement("Etichetta:", wiki.labels.it.value)
                wikiListElement.appendChild(titleElement)

                // Aliases
                if (wiki?.aliases?.it?.value) {
                    const aliasElement = createLiElement("Alias:", wiki.aliases.it.value)
                    wikiListElement.appendChild(aliasElement)
                }

                // Descrizione
                if (wiki?.descriptions?.it?.value) {
                    const descriptionElement = createLiElement("Descrizione:", wiki.descriptions.it.value)
                    wikiListElement.appendChild(descriptionElement)
                }

                // Claims
                if (details.length > 0) {
                    details.forEach(detail => {
                        let detailElement = createLiElement(detail.propertyLabel, detail.valueLabel)
                        wikiListElement.appendChild(detailElement)
                    });

                }

                // Sitelinks
                if (wiki?.sitelinks) {
                    for (const key in wiki.sitelinks) {
                        const link = `<a href="${wiki.sitelinks[key].url}" target="_blank">${wiki.sitelinks[key].title}</a>`
                        const wikiElement = createLiElement(key, link)
                        wikiListElement.appendChild(wikiElement)
                    }
                }

            } catch (error) {
                console.error(error)
            }
            
            // BOX VIAF
            try {

                const viaf = wiki?.claims?.P214?.[0]?.mainsnak?.datavalue?.value

                const works_req = await client.wapiFetch(`https://viaf.org/viaf/${viaf}`, 'GET', {'Accept': 'application/json'}, null)
                
                const works_data = await works_req.json()

                const works_res = works_data['ns1:VIAFCluster']['ns1:titles']['ns1:work']

                let works = []

                if (Array.isArray(works_res)) {
                    works_res.forEach(work => {
                        works.push(work['ns1:title'])
                    })
                } else if (typeof works_res === 'object' && works_res !== null) {
                    works = [works_res['ns1:title']]
                } 
 
                viafCounter.innerText = works.length

                works.forEach(work => {

                    // Titolo
                    const viafelement = document.createElement("li")
                    viafelement.className = "list-group-item border-0 border-bottom"
                    viafelement.innerHTML = `<p class="mb-0">${work}</p>`
                    viafListElement.appendChild(viafelement)
                    viaf_titles.push(work)
                })

            } catch (error) {
                console.error(error)
            }   

            // BOX POAC
            try {
                const opacc_params = new URLSearchParams({
                    core: "autori",
                    "item:6003:Nome": wiki.labels.it.value,
                    "filter_nocheck:6021:Tipo_nome": "Persona:A"
                });
    
                const opac_reqq = await client.wapiFetch(`https://opac.sbn.it/o/opac-api/titles-search-auth?${opacc_params.toString()}`, 'GET', {'Accept': 'application/json'}, null)
                const opac_reqq_data = await opac_reqq.json()
                const opac = opac_reqq_data.data.results.map((entity) => ({
                    vid: entity[0].id.replace("ITICCU", ""),
                    label: entity[0].label.replace(" , ", ", "),
                    type: entity[3].contents[0].value
                }));

                editBtn.hidden = false

                opac.forEach(person => {
                    const opacElement = document.createElement("li")
                    opacElement.className = "list-group-item border-0 mb-2"
                    opacElement.innerHTML = `
                    <div class="card w-100 border rounded p-3">
                        <div class="row w-100 d-flex px-1 mx-auto">
                            <div class="col-6 my-auto">
                                <p class="mb-0">${person.label}</p>
                                <small>${person.type}</small>
                            </div>
                            <div class="col-4 my-auto text-center">
                                <button class="btn btn-sm btn-secondary opac-card" data-bs-toggle="tooltip" title="Apri dettaglio">${person.vid}</button>
                            </div>
                            <div class="col d-flex justify-content-center align-items-center" style="width: fit-content;">
                                <div class="form-check form-switch mt-2">
                                    <p class="mb-0" hidden>${person.label}</p>
                                    <input class="form-check-input bg-danger" type="checkbox" id="flexSwitchCheckDefault" name="radio-button" style="transform: scale(1.0);">
                                </div>
                            </div>
                        </div>
                    </div>
                    `
                    opacListElement.appendChild(opacElement)
                })

            } catch (error) {
                console.error(error)
            }   
        };
    });

    // Apri pagina di segnalazione in una nuova scheda
    noticeBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        
        let now = new Date();
        let year = now.getFullYear();
        let currentMonth = now.getMonth() + 1; 
        let month = currentMonth < 10 ? `0${currentMonth}` : currentMonth;

        let customUrl = "https://www.wikidata.org/w/index.php"
        customUrl += `?preloadtitle=${wiki.labels.it.value}+(WikiPlayground)`
        customUrl += `&preload=Wikidata:SBN/Error%20reports/preload`
        customUrl += `&preloadparams[]=${wiki.labels.it.value}`
        customUrl += `&title=Wikidata:SBN/Error%20reports/${year}/${month}`
        customUrl += `&section=new&action=edit`

        window.open(customUrl, "_blank");

        return true
    });

    // Card candidato OPAC
    document.addEventListener('click', async (event) => {

        if (event.target.classList.contains('opac-card')) {

            opacDetailElement.innerHTML = ""

            backBtn.hidden = false
            opacListElement.hidden = true
            opacDetailElement.hidden = false

            const detail_params = new URLSearchParams({
                core: "autori",
                id: `ITICCU${event.target.innerText}`,
                page: 1
            })

            const detail_req = await client.wapiFetch(`https://opac.sbn.it/o/opac-api/title?${detail_params.toString()}`, 'GET', {'Accept': 'application/json'}, null)
            const detail_data = await detail_req.json();
            const data = detail_data.data.results[0]

            let detail = {
                id: data.id.trim(),
                title: data.title.trim(),
                type: data.pretitle.trim()
            }

            data.contents[0].body.forEach(element => {

                let key = (element[0].value).trim()
                let value = ""
                if (element[1]?.contents) {
                    element[1]?.contents.forEach((subvalue) => {
                        value += (subvalue.value).trim() + "\n"
                    })
                } else if (element[1]?.values) {
                    value = element[1].values[0].value
                } else {
                    value = element[1].value
                }

                detail[key] = value.trim()

            });

            const tableLine = document.createElement("li")
            tableLine.className = "list-group-item border-0"

            const workTableElement = document.createElement("table")
            workTableElement.className = "table table-striped table-sm"
            
            const workTableBodyElement = document.createElement("tbody")
            workTableElement.appendChild(workTableBodyElement)

            for (const key in detail) {
                const opacElement = document.createElement("tr")
                opacElement.innerHTML = `
                <td style="width: fit-content;"><b>${key}</b></td>
                <td class="w-100">${detail[key]}</td>
                `
                workTableBodyElement.appendChild(opacElement)   
            }
            tableLine.appendChild(workTableElement)
            opacDetailElement.appendChild(tableLine)

            const headerLine = document.createElement("li")
            headerLine.className = "list-group-item border-0 border-bottom text-center"
            headerLine.innerHTML = "<b>Documenti collegati</b>"

            opacDetailElement.appendChild(headerLine)

            const params = new URLSearchParams({
                core: "sbn",
                "item:5032:BID": event.target.innerText,
                "page-size": 20,
                page: 1
            })

            const works_req = await client.wapiFetch(`https://opac.sbn.it/o/opac-api/titles-search-post?${params.toString()}`, 'POST', {"Cookie": "COOKIE_SUPPORT=true; GUEST_LANGUAGE_ID=it_IT;"}, null)
            const works_data = await works_req.json();

            const works = works_data.data.results.map((result) => ({
                bid: result.bid,
                title: result.title.info.split(" / ")[0],
                author: result.title.text,
                type: result.type,
                notes: result.infos.join(" | ")
            }))

            works.forEach((work) => {
                const workLiElement = document.createElement("li")
                workLiElement.innerHTML = `
                <p class="mt-1 mb-0"><b>${work.title}</b> <i>${work.author}</i></p>
                <small style="font-size: 0.8em;">[${work["type"]}] ${work.notes}</small>
                `
                if (viaf_titles.some(viaf_title => 
                    viaf_title.toLowerCase().includes(work.title.toLowerCase())
                )) {
                    workLiElement.className = "list-group-item px-1 border-0 border-bottom bg-success text-light"
                } else {
                    workLiElement.className = "list-group-item px-1 border-0 border-bottom"
                }
                opacDetailElement.appendChild(workLiElement)
            })

        }

    });

    // Torna a lista canidati OPAC
    backBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        backBtn.hidden = true
        opacDetailElement.hidden = true
        opacListElement.hidden = false
    });
    
    // Selezione candidato OPAC
    document.addEventListener('click', async (event) => {

        if ((event.target.getAttribute('name') === 'radio-button')) {

            if (event.target.className == "form-check-input bg-danger") {
                event.target.checked = true
                event.target.className = "form-check-input bg-success"
                editBtn.removeAttribute("disabled");
                event.target.value = "selected"
            } else if (event.target.className == "form-check-input bg-success") {
                event.target.checked = false
                event.target.className = "form-check-input bg-danger"
                event.target.value = "on"
            }
        }
    });

    // Bottone inserimento novalue
    noValueBtn.addEventListener('click', async (event) => {
        event.preventDefault();

        noValueBtn.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"></div>`

        let currentDate = new Date().toISOString().split('T')[0]

        const claims = await claimBodyNoMatchValue(currentDate)

        let apiResponse = await client.editEntity(wikid, claims, "WikiPlayground");

        if (apiResponse) {
            noValueBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
            `
            window.open(`https://www.wikidata.org/wiki/Item:${wikid}`, "_blank");
        } else {
            alert('Errore durante la modifica dell\'elemento, riprovare')
        }
        return true
    });

    // Bottone modifica Item
    editBtn.addEventListener('click', async (event) => {
        event.preventDefault();

        editBtn.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"></div>`

        const radios = document.querySelectorAll('input[name="radio-button"]');
        
        let opacList = []

        radios.forEach(radio => {

            if (radio.value == "selected") {
                let extId = radio.parentNode.parentNode.parentNode.querySelector('button').innerText
                let extLabel = radio.parentNode.querySelector('p').innerText.trim()
                let opacObj = {
                    Id: extId,
                    Label: extLabel
                }
                opacList.push(opacObj)
            }
        });

        if (opacList.length === 0) {
            alert('Selezionare almeno un candidato')
            editBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">
                    <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>
                    <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
                </svg>
                `
            return true
        } else if (opacList.length > 0) {

            let currentDate = new Date().toISOString().split('T')[0]
            const claims = await claimBodyValue(opacList, currentDate)

            let apiResponse = await client.editEntity(wikid, claims, "WikiPlayground");
            if (apiResponse) {
                editBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">
                    <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>
                    <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
                </svg>
                `
                window.open(`https://www.wikidata.org/wiki/Item:${wikid}`, "_blank");
            } else {
                alert('Errore durante la modifica dell\'elemento, riprovare')
            }
            return true
        }

    });

});
