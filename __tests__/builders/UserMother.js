import { User } from '../../src/domain/User.js';

export class UserMother {
    static clientePadrao(overrides = {}) {
        return new User(
            overrides.id ?? 1,
            overrides.nome ?? 'Cliente Padrao',
            overrides.email ?? 'cliente.padrao@email.com',
            overrides.tipo ?? 'PADRAO'
        );
    }

    static clientePremium(overrides = {}) {
        return new User(
            overrides.id ?? 2,
            overrides.nome ?? 'Cliente Premium',
            overrides.email ?? 'cliente.premium@email.com',
            overrides.tipo ?? 'PREMIUM'
        );
    }
}
