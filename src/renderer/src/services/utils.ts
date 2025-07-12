import {
  type MutationFunction,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import type { z } from "zod";

interface SchemedQueryArgs<
  TSchema extends z.ZodTypeAny,
  TData = z.infer<TSchema>,
> extends Omit<UseQueryOptions<TData>, "queryFn"> {
  schema: TSchema;
  queryFn: () => Promise<unknown>;
}

/**
 * A wrapper around React Query's useQuery that automatically validates the response
 * using a Zod schema before returning the data.
 *
 * @param options - Configuration object containing schema, queryFn, and other React Query options
 * @param options.schema - Zod schema to validate the query response
 * @returns A React Query result object with validated data of type TData
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSchemedQuery({
 *   schema: userSchema,
 *   queryFn: () => fetchUser(id),
 *   queryKey: ['user', id]
 * });
 * ```
 */
export const useSchemedQuery = <
  TSchema extends z.ZodTypeAny,
  TData = z.infer<TSchema>,
>({
  schema,
  queryFn,
  queryKey,
  ...options
}: SchemedQueryArgs<TSchema>) =>
  useQuery<TData>({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();
        const parsed = schema.parse(response);
        return parsed;
      } catch (e) {
        console.error(`Failed to run query: [${queryKey.join(", ")}]`, e);

        throw e;
      }
    },
    ...options,
  });

interface SchemedMutationArgs<
  TSchema extends z.ZodTypeAny,
  TMutationArgs extends z.Primitive,
> extends UseMutationOptions<z.infer<TSchema>, Error, TMutationArgs> {
  schema?: TSchema;
  mutationFn: MutationFunction<unknown, TMutationArgs>;
}

/**
 * A wrapper around React Query's useMutation that optionally validates the response
 * using a Zod schema before returning the data.
 *
 * @param options - Configuration object containing schema, mutationFn, and other React Query options
 * @param options.schema - Optional Zod schema to validate the mutation response
 * @returns A React Query mutation object with validated data if schema is provided
 *
 * @example
 * ```tsx
 * const mutation = useSchemedMutation({
 *   schema: userSchema,
 *   mutationFn: (userData) => createUser(userData),
 * });
 *
 * // Without schema validation
 * const mutation = useSchemedMutation({
 *   mutationFn: (userData) => createUser(userData),
 * });
 * ```
 */
export const useSchemedMutation = <
  TSchema extends z.ZodTypeAny,
  TMutationArgs extends z.Primitive,
>({
  schema,
  mutationFn,
  ...options
}: SchemedMutationArgs<TSchema, TMutationArgs>) => {
  const fnWrapper: MutationFunction<z.infer<TSchema>, TMutationArgs> = async (
    ...args
  ) => {
    if (mutationFn) {
      const response = await mutationFn(...args);

      if (schema) return schema.parse(response);
      return;
    }
  };
  return useMutation({
    mutationFn: fnWrapper,
    ...options,
  });
};
