'use client';
import { Field, Formik } from 'formik';
import { Button, FormControl, FormErrorMessage, Input, useToast, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { useApi } from '@/hooks';
import { ISignup } from '@/utils/types';

const aliases = {
    username: 'Никнейм',
    email: 'Почта',
    password: 'Пароль',
    repeatedPassword: 'Повторите пароль'
};

type IAlias = keyof typeof aliases;

export function AuthForm({ login }: { login?: boolean }) {
    const toast = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const api = useApi();

    return <Formik
        initialValues={{
            username: '',
            email: '',
            password: '',
            repeatedPassword: ''
        }}
        onSubmit={async (values: ISignup) => {
            if (!login && values.password !== values.repeatedPassword) return toast({
                status: 'error',
                title: 'Ошибка',
                description: 'Пароли не совпадают!',
                duration: 3000,
                isClosable: true
            });

            // setLoading(true);
            await api[login ? 'signin' : 'signup'](values);
            // if (!ok) setLoading(false);
        }}
    >
        {({ handleSubmit, errors, touched }) => <form style={{ width: '25%' }} onSubmit={handleSubmit}>
            <VStack w='100%' spacing='8px' align='start'>
                {(login ? ['username', 'password'] : ['username', 'email', 'password', 'repeatedPassword']).map((field: string, i: number) =>
                    <FormControl key={i} isInvalid={!!errors[field as keyof typeof errors] && !!touched[field as keyof typeof errors]}>
                        <Field
                            as={Input}
                            h='50px'
                            rounded='15px'
                            id={field}
                            name={field}
                            placeholder={aliases[(login ? (field === 'username' ? 'email' : field) : field) as IAlias]}
                            // validate={(value: string) => {
                            //     let error;
                            //     if (value.length !== 10) error = 'Номер телефона должен быть без кода страны';
                            //     return error;
                            // }}
                        />

                        <FormErrorMessage>{errors[field as keyof typeof errors]?.toString()}</FormErrorMessage>
                    </FormControl>)}

                <Button type='submit' width='100%' h='50px' isLoading={loading}>{login ? 'Войти' : 'Зарегистрироваться'}</Button>
            </VStack>
        </form>}
    </Formik>;
}