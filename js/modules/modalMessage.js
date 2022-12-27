export default class ModalMessage {
    static messages = [];
    static #modalContainer = document.querySelector('.modal');
    static #modalCloseBtn =
        ModalMessage.#modalContainer.querySelector('.modal__btn-close');
    #timeout;

    constructor(msg, seconds = 2) {
        this._msg = msg;
        this._seconds = seconds;

        this._insertMessage();
        ModalMessage.#modalCloseBtn.addEventListener(
            'click',
            this._closeModal.bind(this)
        );

        ModalMessage.messages.at(-1)?.cancelTimeout();
        ModalMessage.messages.push(this);
        if (ModalMessage.messages.length === 2)
            ModalMessage.messages.splice(0, 1);
    }

    _insertMessage() {
        ModalMessage.#modalContainer.querySelector('.modal__content') &&
            ModalMessage.#modalContainer.removeChild(
                ModalMessage.#modalContainer.querySelector('.modal__content')
            );

        ModalMessage.#modalContainer.insertAdjacentHTML(
            'beforeend',
            `<div class="modal__content">${this._msg}</div>`
        );
    }

    cancelTimeout() {
        clearTimeout(this.#timeout);
    }

    openModal() {
        if (ModalMessage.#modalContainer.matches('.hidden')) {
            ModalMessage.#modalContainer.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        this.#timeout = setTimeout(
            this._closeModal.bind(this),
            this._seconds * 1000
        );
    }

    _closeModal(e) {
        e?.preventDefault();

        if (!ModalMessage.#modalContainer.matches('.hidden')) {
            ModalMessage.#modalContainer.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
}
