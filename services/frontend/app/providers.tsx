'use client';
import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider, createMultiStyleConfigHelpers, defineStyleConfig, extendTheme } from '@chakra-ui/react';
import { Provider } from '@/redux/provider';
import '@fontsource-variable/manrope';
import { SocketContextProvider } from '@/app/SocketContext';
import { inputAnatomy } from '@chakra-ui/anatomy';

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(inputAnatomy.keys);

export function Providers({ children }: { children: React.ReactNode }) {
    return <Provider>
        <CacheProvider>
            <ChakraProvider theme={extendTheme({
                fonts: {
                    body: `'Manrope Variable', sans-serif`
                },
                colors: {
                    main: {
                        100: '#000000'
                    }
                },
                components: {
                    Button: defineStyleConfig({
                        baseStyle: {
                            rounded: '15px'
                        }
                    }),
                    Input: defineMultiStyleConfig({
                        baseStyle: definePartsStyle({
                            field: {
                                rounded: '15px'
                            }
                        })
                    })
                }
            })}>
                <SocketContextProvider>
                    {children}
                </SocketContextProvider>
            </ChakraProvider>
        </CacheProvider>
    </Provider>;
}