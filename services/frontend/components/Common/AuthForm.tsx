'use client';
import { Field, Formik } from 'formik';
import { Button, FormControl, FormErrorMessage, Input, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { useSelector } from '@/redux/hooks';
import { useApi } from '@/hooks';
import { ISignup } from '@/utils/types';

export function AuthForm({ login }: { login?: boolean }) {
    const [loading, setLoading] = useState<boolean>(false);
    const { device } = useSelector(state => state.misc);

    const { signin, signup } = useApi();

    return <Formik
        initialValues={{
            username: '',
            email: '',
            password: ''
        }}
        onSubmit={async (values: ISignup) => {
            setLoading(true);
            const method = login ? signin : signup;
            const ok = await method(values);
            if (!ok) setLoading(false);
        }}
    >
        {({ handleSubmit, errors, touched }) => <form style={{ width: device === 'laptop' ? '50%' : '100%' }} onSubmit={handleSubmit}>
            <VStack w='100%' spacing='8px' align='start'>
                {(login ? ['username', 'password'] : ['username', 'email', 'password']).map((field: string, i: number) =>
                    <FormControl key={i} isInvalid={!!errors[field as keyof typeof errors] && !!touched[field as keyof typeof errors]}>
                        <Field
                            as={Input}
                            h='50px'
                            rounded='15px'
                            id={field}
                            name={field}
                            placeholder={login ? (field === 'username' ? 'email' : field) : field}
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