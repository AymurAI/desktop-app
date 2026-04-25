import {
  type QueryFunction,
  type QueryKey,
  type UseQueryOptions,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import type { z } from "zod";

interface SchemedQueryArgs<
  TSchema extends z.ZodTypeAny,
  TError = Error,
  TQueryKey extends QueryKey = readonly unknown[],
  TData = unknown,
> extends Omit<
    UseQueryOptions<z.infer<TSchema>, TError, TData, TQueryKey>,
    "queryFn"
  > {
  schema: TSchema;
  queryFn: QueryFunction<unknown, TQueryKey>;
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
  TError = Error,
  TQueryKey extends QueryKey = readonly unknown[],
  TData = z.infer<TSchema>,
>({
  schema,
  queryFn,
  queryKey,
  ...options
}: SchemedQueryArgs<TSchema, TError, TQueryKey, TData>) =>
  useQuery({
    queryKey,
    queryFn: async (...args) => {
      try {
        const response = await queryFn(...args);
        const parsed = await schema.parseAsync(response);
        return parsed;
      } catch (e) {
        console.error(`Failed to run query: [${queryKey.join(", ")}]`, e);

        throw e;
      }
    },
    ...options,
  });

interface SchemedQueriesArgs<TSchema extends z.ZodTypeAny, TError = Error>
  extends Omit<
    UseQueryOptions<unknown, TError, z.infer<TSchema>, QueryKey>,
    "queryFn"
  > {
  queryFn: QueryFunction<unknown, QueryKey>;
}

/**
 * A wrapper around React Query's useQueries that automatically validates the response
 * using a Zod schema before returning the data for each query.
 *
 * @param options - Configuration object containing schema and queries array
 * @param options.schema - Zod schema to validate all query responses
 * @param options.queries - Array of query configurations
 * @returns An array of React Query result objects with validated data of type TData
 *
 * @example
 * ```tsx
 * const results = useSchemedQueries({
 *   schema: userSchema,
 *   queries: [
 *     {
 *       queryFn: () => fetchUser(id1),
 *       queryKey: ['user', id1]
 *     },
 *     {
 *       queryFn: () => fetchUser(id2),
 *       queryKey: ['user', id2]
 *     }
 *   ]
 * });
 * ```
 */
export const useSchemedQueries = <
  TSchema extends z.ZodTypeAny,
  TError = Error,
>({
  schema,
  queries,
  ...options
}: {
  schema: TSchema;
  queries: Array<SchemedQueriesArgs<TSchema, TError>>;
}) =>
  useQueries({
    queries: queries.map(({ queryFn, ...queryOptions }) => ({
      ...queryOptions,
      queryFn: async (args) => {
        try {
          const response = await queryFn(args);
          const parsed = await schema.parseAsync(response);
          return parsed;
        } catch (e) {
          console.error(
            `Failed to run query: [${queryOptions.queryKey.join(", ")}]`,
            e,
          );

          throw e;
        }
      },
    })),
    ...options,
  });
