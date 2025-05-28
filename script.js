// Constantes: Pegando os elementos do HTML pelo ID
const tipoPapelSelect = document.getElementById('TipoPapel');
const tipoGramaturaSelect = document.getElementById('TipoGramatura');
const quantidadePaginasInput = document.getElementById('QuantidadePáginas');
const tipoEncadernacaoCheckbox = document.getElementById('tipoEncadernacao');
const formulario = document.getElementById('calculadoraLombadaForm');
const resultadoLombadaDiv = document.getElementById('resultadoLombada');

let dadosPapeis = []; // Variável para armazenar os dados do JSON

// --- 1. Função para carregar os dados do JSON ---
async function carregarDadosPapeis() {
    try {
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
        // Exibe o nome do papel como ele está no JSON
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
            // O valor da opção será a string exata do JSON (ex: "56", "65 2.0")
            option.value = gramatura.valor;
            // O texto visível será a gramatura, adicionando "g" se for um número, ou mantendo como está
            // Esta é a principal mudança aqui para exibir 'g'
            if (!isNaN(parseInt(gramatura.valor))) { // Se o valor pode ser convertido para número (ex: "56")
                option.textContent = `${gramatura.valor}g`;
            } else { // Se o valor tem texto (ex: "PAPER CREAMY 78G", "65 2.0")
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
    const isCartonado = tipoEncadernacaoCheckbox.checked;

    if (!papelSelecionado || !gramaturaSelecionadaValor || isNaN(quantidadePaginas) || quantidadePaginas <= 0) {
        resultadoLombadaDiv.innerHTML = '<p class="error">Por favor, preencha todos os campos e insira uma quantidade de páginas válida.</p>';
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
        resultadoLombadaDiv.innerHTML = '<p class="error">Não foi possível encontrar o valor base da lombada para a seleção. Verifique seus dados.</p>';
        return;
    }

    // Calcula o valor base da lombada
    let lombadaCalculada = quantidadePaginas / valorBaseLombada;

    // Aplica o acréscimo de acordo com a encadernação
    if (isCartonado) {
        lombadaCalculada += 4;
    } else {
        lombadaCalculada += 1;
    }

    resultadoLombadaDiv.innerHTML = `<p class="success">A lombada calculada é: <strong>${lombadaCalculada.toFixed(1)} mm</strong></p>`;
}

// --- 5. Adicionar os "Ouvintes de Eventos" (Event Listeners) ---

document.addEventListener('DOMContentLoaded', carregarDadosPapeis);

tipoPapelSelect.addEventListener('change', () => {
    popularTipoGramatura(tipoPapelSelect.value);
    resultadoLombadaDiv.innerHTML = ''; // Limpa o resultado
});

formulario.addEventListener('submit', calcularLombada);

// Opcional: Limpar o resultado quando a gramatura, páginas ou encadernação mudam
tipoGramaturaSelect.addEventListener('change', () => {
    resultadoLombadaDiv.innerHTML = '';
});
quantidadePaginasInput.addEventListener('input', () => {
    resultadoLombadaDiv.innerHTML = '';
});
tipoEncadernacaoCheckbox.addEventListener('change', () => {
    resultadoLombadaDiv.innerHTML = '';
});