import { CheckoutService } from '../src/services/CheckoutService.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { UserMother } from './builders/UserMother.js';

describe('CheckoutService', () => {
    const cartaoCredito = {
        numero: '4111111111111111',
        validade: '12/30',
        cvv: '123'
    };

    function criarService({ pagamentoAprovado = true, pedidoId = 'pedido-001' } = {}) {
        const gatewayPagamento = {
            cobrar: jest.fn().mockResolvedValue({ success: pagamentoAprovado })
        };
        const pedidoRepository = {
            salvar: jest.fn().mockImplementation(async (pedido) => ({
                ...pedido,
                id: pedidoId
            }))
        };
        const emailService = {
            enviarEmail: jest.fn().mockResolvedValue(undefined)
        };

        const checkoutService = new CheckoutService(
            gatewayPagamento,
            pedidoRepository,
            emailService
        );

        return {
            checkoutService,
            gatewayPagamento,
            pedidoRepository,
            emailService
        };
    }

    it('deve retornar null se o GatewayPagamento recusar a cobranca', async () => {
        const { checkoutService } = criarService({ pagamentoAprovado: false });
        const carrinho = new CarrinhoBuilder().build();

        const resultado = await checkoutService.processarPedido(carrinho, cartaoCredito);

        expect(resultado).toBeNull();
    });

    it('deve retornar o pedido salvo com totalFinal correto para cliente padrao', async () => {
        const { checkoutService, gatewayPagamento, pedidoRepository } = criarService({
            pedidoId: 'pedido-padrao'
        });
        const carrinho = new CarrinhoBuilder()
            .comItens([
                { nome: 'Livro', preco: 80 },
                { nome: 'Mouse', preco: 40 }
            ])
            .build();

        const resultado = await checkoutService.processarPedido(carrinho, cartaoCredito);

        expect(gatewayPagamento.cobrar).toHaveBeenCalledWith(120, cartaoCredito);
        expect(pedidoRepository.salvar).toHaveBeenCalledWith(
            expect.objectContaining({
                carrinho,
                totalFinal: 120,
                status: 'PROCESSADO'
            })
        );
        expect(resultado).toEqual(
            expect.objectContaining({
                id: 'pedido-padrao',
                totalFinal: 120,
                status: 'PROCESSADO'
            })
        );
    });

    it('deve aplicar 10% de desconto ao chamar o GatewayPagamento se o usuario for PREMIUM', async () => {
        const { checkoutService, gatewayPagamento } = criarService();
        const carrinho = new CarrinhoBuilder()
            .comUsuario(UserMother.clientePremium())
            .comItens([
                { nome: 'Teclado', preco: 100 },
                { nome: 'Monitor', preco: 200 }
            ])
            .build();

        await checkoutService.processarPedido(carrinho, cartaoCredito);

        expect(gatewayPagamento.cobrar).toHaveBeenCalledWith(270, cartaoCredito);
    });

    it('deve chamar o EmailService.enviarEmail com os dados corretos apos pagamento bem-sucedido', async () => {
        const { checkoutService, emailService } = criarService({
            pedidoId: 'pedido-email'
        });
        const user = UserMother.clientePadrao({
            email: 'maria@email.com'
        });
        const carrinho = new CarrinhoBuilder()
            .comUsuario(user)
            .comItens([{ nome: 'Curso', preco: 150 }])
            .build();

        await checkoutService.processarPedido(carrinho, cartaoCredito);

        expect(emailService.enviarEmail).toHaveBeenCalledWith(
            'maria@email.com',
            'Seu Pedido foi Aprovado!',
            'Pedido pedido-email no valor de R$150'
        );
    });

    it('nao deve chamar o EmailService nem o PedidoRepository se o pagamento falhar', async () => {
        const { checkoutService, pedidoRepository, emailService } = criarService({
            pagamentoAprovado: false
        });
        const carrinho = new CarrinhoBuilder().build();

        await checkoutService.processarPedido(carrinho, cartaoCredito);

        expect(pedidoRepository.salvar).not.toHaveBeenCalled();
        expect(emailService.enviarEmail).not.toHaveBeenCalled();
    });
});
