// Constantes: Pegando os elementos do HTML pelo ID
const tipoPapelSelect = document.getElementById('TipoPapel');
const tipoGramaturaSelect = document.getElementById('TipoGramatura');
const quantidadePaginasInput = document.getElementById('QuantidadePáginas');
const tipoEncadernacaoCheckbox = document.getElementById('tipoEncadernacao'); // Cartonado
const tipoCapaFresadoCheckbox = document.getElementById('tipoCapaFresado'); // Fresado
const tipoCapaCosturadoCheckbox = document.getElementById('tipoCapaCosturado'); // Costurado
const formulario = document.getElementById('calculadoraLombadaForm');
const resultadoLombadaDiv = document.getElementById('resultadoLombada'); 

// Novos elementos do pop-up
const popupResultado = document.getElementById('popupResultado');
const popupMensagem = document.getElementById('popupMensagem');
const closeButton = document.querySelector('.close-button');

let dadosPapeis = []; // Variável para armazenar os dados do JSON

// --- 1. Função para carregar os dados do JSON ---
async function carregarDadosPapeis() {
    try {
        // Altere 'PapeisGramaturas.json' se o nome do seu arquivo JSON for diferente
        const response = await fetch('PapeisGramaturas.json'); 
        if (!response.ok) {
            throw new Error(`Erro ao carregar os dados: ${response.statusText}`);
        }
        dadosPapeis = await response.json();
        console.log('Dados dos papéis carregados:', dadosPapeis);
        popularTipoPapel();
    } catch (error) {
        console.error('Falha ao carregar os dados dos papéis:', error);
        resultadoLombadaDiv.innerHTML = '<p class="error">Erro ao carregar as opções de papel. Verifique o arquivo JSON e o console do navegador.</p>';
    }
}

// --- 2. Função para popular o select de Tipo de Papel ---
function popularTipoPapel() {
    tipoPapelSelect.innerHTML = '<option value="" disabled selected>Selecione o tipo de papel</option>';

    dadosPapeis.forEach(papel => {
        const option = document.createElement('option');
        option.value = papel.nome;
        option.textContent = papel.nome;
        tipoPapelSelect.appendChild(option);
    });
}

// --- 3. Função para popular o select de Tipo de Gramatura ---
function popularTipoGramatura(papelSelecionado) {
    tipoGramaturaSelect.innerHTML = '<option value="" disabled selected>Selecione o tipo de Gramatura</option>';
    tipoGramaturaSelect.disabled = true;

    if (!papelSelecionado) {
        return;
    }

    const papelEncontrado = dadosPapeis.find(papel => papel.nome === papelSelecionado);

    if (papelEncontrado && papelEncontrado.gramaturas.length > 0) {
        tipoGramaturaSelect.disabled = false;
        papelEncontrado.gramaturas.forEach(gramatura => {
            const option = document.createElement('option');
            option.value = gramatura.valor;
            if (!isNaN(parseInt(gramatura.valor))) { 
                option.textContent = `${gramatura.valor}g`;
            } else { 
                option.textContent = gramatura.valor;
            }
            tipoGramaturaSelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nenhuma gramatura disponível";
        tipoGramaturaSelect.appendChild(option);
    }
}

// --- 4. Função principal para calcular a lombada---
function calcularLombada(event) {
    event.preventDefault();

    const papelSelecionado = tipoPapelSelect.value;
    const gramaturaSelecionadaValor = tipoGramaturaSelect.value;
    const quantidadePaginas = parseInt(quantidadePaginasInput.value);
    
    // Obter o estado de todos os checkboxes
    const isCartonado = tipoEncadernacaoCheckbox.checked;
    const isCapaFresado = tipoCapaFresadoCheckbox.checked;
    const isCapaCosturado = tipoCapaCosturadoCheckbox.checked;

    // ---------------------------------------------------------------------
    // Validação OBRIGATÓRIA: garantir que pelo menos uma encadernação foi selecionada
    if (!isCartonado && !isCapaFresado && !isCapaCosturado) {
        popupMensagem.textContent = 'Por favor, selecione pelo menos um tipo de encadernação (Cartonado, Fresado ou Costurado) para calcular.';
        popupMensagem.className = 'error';
        popupResultado.style.display = 'flex';
        return;
    }
    // ---------------------------------------------------------------------

    if (!papelSelecionado || !gramaturaSelecionadaValor || isNaN(quantidadePaginas) || quantidadePaginas <= 0) {
        popupMensagem.textContent = 'Por favor, preencha todos os campos e insira uma quantidade de páginas válida.';
        popupMensagem.className = 'error';
        popupResultado.style.display = 'flex';
        return;
    }
    
    let valorBaseLombada = 0;
    const papel = dadosPapeis.find(p => p.nome === papelSelecionado);
    if (papel) {
        const gramatura = papel.gramaturas.find(g => g.valor === gramaturaSelecionadaValor);
        if (gramatura) {
            valorBaseLombada = gramatura.valor_base_lombada;
        }
    }

    if (valorBaseLombada === 0) {
        popupMensagem.textContent = 'Não foi possível encontrar o valor base da lombada para a seleção. Verifique seus dados.';
        popupMensagem.className = 'error';
        popupResultado.style.display = 'flex';
        return;
    }

    // Calcula o valor base da lombada (sem acréscimos)
    let lombadaCalculada = quantidadePaginas / valorBaseLombada;
    let tipoEncadernacaoTexto = "";

    // --- LÓGICA DE ACRÉSCIMO/DECRÉSCIMO E TEXTO ---
    
    // 1. Prioridade para Cartonado (+4 mm)
    if (isCartonado) {
        lombadaCalculada += 4; 
        tipoEncadernacaoTexto = "Cartonado";
        
        // Verifica se Fresado ou Costurado estão marcados (Lembre-se: eles são mutuamente exclusivos, se um estiver true o outro será false)
        if (isCapaFresado) {
            tipoEncadernacaoTexto += " e Fresado";
        }
        if (isCapaCosturado) {
            tipoEncadernacaoTexto += " e Costurado";
        }
    } 
    // 2. Se não é Cartonado, verifica o Costurado (+1 mm)
    else if (isCapaCosturado) {
        lombadaCalculada += 1; 
        tipoEncadernacaoTexto = "Costurado";
        
        // Não precisamos verificar o Fresado aqui, pois se ele estivesse marcado, o Costurado
        // teria sido desmarcado pelo Event Listener (regra de exclusividade)
    } 
    // 3. O que sobrou é apenas Fresado (+0 mm)
    else if (isCapaFresado) {
        lombadaCalculada += 0; 
        tipoEncadernacaoTexto = "Fresado";
    }

    // ----------------------------------------

    popupMensagem.textContent = `A lombada (${tipoEncadernacaoTexto}) é: ${lombadaCalculada.toFixed(1)} mm`;
    popupMensagem.className = 'success';
    popupResultado.style.display = 'flex';
}

// --- 5. Adicionar os "Ouvintes de Eventos" (Event Listeners) ---

document.addEventListener('DOMContentLoaded', carregarDadosPapeis);

tipoPapelSelect.addEventListener('change', () => {
    popularTipoGramatura(tipoPapelSelect.value);
    popupResultado.style.display = 'none'; // Esconde o pop-up ao mudar o papel
});

formulario.addEventListener('submit', calcularLombada);

// Fechar o pop-up ao clicar no botão de fechar
closeButton.addEventListener('click', () => {
    popupResultado.style.display = 'none';
});

// Fechar o pop-up ao clicar fora dele
window.addEventListener('click', (event) => {
    if (event.target === popupResultado) {
        popupResultado.style.display = 'none';
    }
});

// Esconder o pop-up quando os campos de input/select mudam
tipoGramaturaSelect.addEventListener('change', () => {
    popupResultado.style.display = 'none';
});
quantidadePaginasInput.addEventListener('input', () => {
    popupResultado.style.display = 'none';
});
tipoEncadernacaoCheckbox.addEventListener('change', () => {
    popupResultado.style.display = 'none';
});

// --- 6. Lógica de Exclusividade MÚTUA (Costurado vs. Fresado) ---

// Ao marcar o Costurado, desmarca o Fresado
tipoCapaCosturadoCheckbox.addEventListener('change', () => {
    // Se o Costurado foi marcado, e o Fresado estava marcado, desmarca o Fresado.
    if (tipoCapaCosturadoCheckbox.checked && tipoCapaFresadoCheckbox.checked) {
        tipoCapaFresadoCheckbox.checked = false;
    }
    popupResultado.style.display = 'none';
});

// Ao marcar o Fresado, desmarca o Costurado
tipoCapaFresadoCheckbox.addEventListener('change', () => {
    // Se o Fresado foi marcado, e o Costurado estava marcado, desmarca o Costurado.
    if (tipoCapaFresadoCheckbox.checked && tipoCapaCosturadoCheckbox.checked) {
        tipoCapaCosturadoCheckbox.checked = false;
    }
    popupResultado.style.display = 'none';
});
