import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

export class CarrinhoBuilder {
    constructor() {
        this.user = UserMother.clientePadrao();
        this.itens = [new Item('Produto Teste', 100)];
    }

    comUsuario(user) {
        this.user = user;
        return this;
    }

    comItem(nome, preco) {
        this.itens.push(new Item(nome, preco));
        return this;
    }

    comItens(itens) {
        this.itens = itens.map((item) => new Item(item.nome, item.preco));
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        return new Carrinho(this.user, this.itens);
    }
}
