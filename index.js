import { randomItem } from "./js/wiki.js";
import { opacApi } from "./js/opac.js"

const wikiCard = document.getElementById('iframe_wiki_card');

const nextBtn = document.getElementById('next_btn');
const editBtn = document.getElementById('edit_btn');
const counterBtn = document.getElementById('count_btn');
const counterValue = document.getElementById('count_btn');

const listGroupElement = document.getElementById('opac_list');


const main = async () => {

    listGroupElement.innerHTML = ""

    let wikiResponse = await randomItem()

    let itemId = wikiResponse.results.bindings[0].item.value.split("/").pop()
    let itemLabel = wikiResponse.results.bindings[0].itemLabel.value

    wikiCard.innerHTML = `
        <iframe class="card-img-top" src="https://www.wikidata.org/wiki/Item:${itemId}" style="height: 100%; width: 100%;" title="Wiki Random Page"></iframe>
    `
    
    let candidates = await opacApi(itemLabel)

    if (candidates.length > 0) {
        counterBtn.className = "btn btn-outline-success mx-auto shadow"
    } else {
        counterBtn.className = "btn btn-outline-danger mx-auto shadow"
        let notFoundElement = document.createElement("li")
        notFoundElement.className = "list-group-item border-0 mx-1 bg-transparent"
        notFoundElement.innerHTML = `
        <div class="card text-center shadow my-5" style="overflow: hidden; width: fit-content;">
            <div class="card-body">
                <h3 class="my-auto">Nessun risultato trovato</h3>
            </div>
        </div>
        `
        listGroupElement.appendChild(notFoundElement)
    }

    counterBtn.innerHTML = `
    <h1 class="mt-2">${candidates.length}</h1>
    `
    
    //let bookList = await authorBookList("")
    
    candidates.forEach(entity => {

        let opacFrameUrl = `https://opac.sbn.it/risultati-autori/-/opac-autori/detail/${entity[0].id}`
        let entityId = entity[0].id

        let entityBid = entityId.replace("ITICCU", "")

        let entityElement = document.createElement("li")
        entityElement.className = "list-group-item border-0 mx-1 bg-transparent"
        entityElement.innerHTML = `
        <div class="card text-center shadow mb-2" style="overflow: hidden; width: fit-content;">
            <div class="card-img-top p-0">
                <iframe src="${opacFrameUrl}" height="600" width="425" style="margin-top: -260px;" title="Iframe Example"></iframe>
            </div>
            <div class="card-body">
                <h5 class="card-title" style="display: none;">${entity[0].label}</h5>
                <p class="card-text mb-2" style="display: none;">${entityId}</p>
                <div class="row justify-content-center align-items-center">
                    <div class="col-3"></div>
                    <div class="col-3 d-flex mx-1">
                        <a type="button" href="${opacFrameUrl}" class="btn btn-outline-secondary border-0 justify-content-center align-items-center" style="width: 2.5em;  height: 2.5em; padding-left: 0.45em;" target="_blank">
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor mx-2" class="bi bi-person" viewBox="0 0 16 16">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                            </svg>
                        </a>
                        <a type="button" href="https://opac.sbn.it/risultati-ricerca-avanzata?item%3A5032%3ABID=${entityBid}" class="btn btn-outline-secondary border-0 justify-content-center align-items-center" style="width: 2.5em;  height: 2.5em; padding-left: 0.45em;" target="_blank">
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor mx-2" class="bi bi-book" viewBox="0 0 16 16">
                            <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
                            </svg>
                        </a>
                    </div>

                    <div class="col-3 mx-1 justify-content-end">
                    <div class="row">
                        <div class="col-6">

                        </div>
                        <div class="col-6">
                            <div class="form-check form-switch mt-2" style="margin-right: 0; padding-right: 0;">
                            <input class="importradio form-check-input bg-danger my-auto" type="checkbox" id="flexSwitchCheckDefault" name="radio-button" style="transform: scale(1.5);">
                        </div>
                        </div>
                    </div>

                        
                    </div>
                </div>
                    
                    
            </div>
        </div>
        `
        listGroupElement.appendChild(entityElement)
        }
    );

};

main()


// Next item button listener
nextBtn.addEventListener('click', function(event) {
    event.preventDefault();
    counterBtn.className = "btn btn-outline-secondary mx-auto shadow"
    counterBtn.innerHTML = `
    <h1 class="mt-2">-</h1>
    `
    main()
});


document.getElementsByClassName('importradio').addEventListener("change", function(event) {
    event.preventDefault()
    alert("checked radio 1");
});
